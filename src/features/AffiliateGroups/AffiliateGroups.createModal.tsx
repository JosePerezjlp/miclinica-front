import React, { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  affiliatesService,
  type AffiliateResponse,
} from "../../api/affiliates.service";
import { mobbexService } from "../../api/mobbex.service";
import { paymentsService } from "../../api/payments.service";
import { plansService } from "../../api/plans.service";
import { promotersService } from "../../api/promoters.service";
import {
  paymentGatewayOptions,
  sellerOptions,
  cityOptions,
} from "./AffiliateGroups.constants";
import type {
  AutomaticAffiliateGroupFormData,
  CashAffiliateGroupFormData,
  CashMember,
  CreateGroupSubmitResult,
  CreateAffiliateGroupModalPayload,
  MobbexSubscriptionSummary,
  PaymentMode,
  PaymentGatewayProvider,
} from "./AffiliateGroups.types";
import type { PlanResponse } from "../Plans/Plans.types";
import type { PromoterResponse } from "../Promoters/Promoters.types";

interface CreateAffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateAffiliateGroupModalPayload,
  ) =>
    | Promise<CreateGroupSubmitResult | undefined>
    | CreateGroupSubmitResult
    | undefined;
}

const emptyCashMember: CashMember = {
  id: 0,
  firstName: "",
  lastName: "",
  birthDate: "",
  dni: "",
  address: "",
  email: "",
  phone: "",
  inscriptionDate: "",
};

const PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY =
  "miclinica.payway.deviceFingerprintId";

function buildPaywayDeviceFingerprintId(): string {
  const randomPart =
    typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const timeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone.replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 16)
      : "local";

  return `payway-${timeZone || "local"}-${randomPart}`.slice(0, 64);
}

function getOrCreatePaywayDeviceFingerprintId(): string {
  if (typeof window === "undefined") {
    return buildPaywayDeviceFingerprintId();
  }

  try {
    const stored = window.localStorage.getItem(
      PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY,
    );
    if (stored) {
      return stored;
    }

    const created = buildPaywayDeviceFingerprintId();
    window.localStorage.setItem(PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY, created);
    return created;
  } catch {
    return buildPaywayDeviceFingerprintId();
  }
}

function formatPlanLabel(plan: PlanResponse): string {
  const amount = Number(plan.monthlyFee);

  return `${plan.name} - ${new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount)}`;
}

function parseCurrencyInput(value: string): number | undefined {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const AffiliateGroupsCreateModal: React.FC<CreateAffiliateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [mode, setMode] = useState<PaymentMode>("automatic");

  // Automatic payment form
  const [autoData, setAutoData] = useState<
    Omit<AutomaticAffiliateGroupFormData, "mode">
  >({
    gateway: paymentGatewayOptions[0].value,
    plan: "",
    planId: undefined,
    mobbexSubscriptionId: "",
    mobbexWebhook: "",
    paymentMethod: "card",
    cbu: "",
    cardNumber: "",
    cardMonth: "",
    cardYear: "",
    cardCvv: "",
    firstName: "",
    lastName: "",
    dni: "",
    deviceFingerprintId: "",
  });
  const [mobbexSubscriptions, setMobbexSubscriptions] = useState<
    MobbexSubscriptionSummary[]
  >([]);
  const [localPlans, setLocalPlans] = useState<PlanResponse[]>([]);
  const [localPromoters, setLocalPromoters] = useState<PromoterResponse[]>([]);
  const [isLoadingLocalPlans, setIsLoadingLocalPlans] = useState(false);
  const [isLoadingPromoters, setIsLoadingPromoters] = useState(false);
  const [localPlansError, setLocalPlansError] = useState("");
  const [promotersError, setPromotersError] = useState("");
  const [isLoadingMobbexSubscriptions, setIsLoadingMobbexSubscriptions] =
    useState(false);
  const [mobbexSubscriptionsError, setMobbexSubscriptionsError] = useState("");
  const [generatedMobbexLink, setGeneratedMobbexLink] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [detectedCardBrand, setDetectedCardBrand] = useState("");
  const [detectedCardType, setDetectedCardType] = useState<"credit" | "debit" | "prepaid" | null>(null);
  const [detectedPaywayMethodId, setDetectedPaywayMethodId] = useState<number | null>(null);

  // Cash payment form
  const [cashData, setCashData] = useState<
    Omit<CashAffiliateGroupFormData, "mode" | "members">
  >({
    promoterId: undefined,
    promoterName: "",
    seller: "",
    plan: "",
    planId: undefined,
    planAmount: undefined,
    paidAmount: undefined,
    discountAmount: undefined,
    discountReason: "",
    city: cityOptions[0],
    cityId: null,
  });

  const [members, setMembers] = useState<CashMember[]>([]);
  const [memberDraft, setMemberDraft] = useState<CashMember>(emptyCashMember);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [memberFormError, setMemberFormError] = useState("");
  const [cashError, setCashError] = useState("");
  const [autoError, setAutoError] = useState("");
  const [memberIdCounter, setMemberIdCounter] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateDniDialog, setDuplicateDniDialog] = useState<{
    context: "auto" | "member";
    dni: string;
    affiliate: AffiliateResponse;
  } | null>(null);
  const duplicateDniResolver = useRef<((value: boolean) => void) | null>(null);
  const autoFormRef = useRef<HTMLFormElement | null>(null);
  const cashFormRef = useRef<HTMLFormElement | null>(null);

  const handleAutoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "dni") {
      setAutoError("");
    }

    setAutoData((prev) => {
      if (name === "gateway") {
        const gateway = value as PaymentGatewayProvider;
        const paymentMethod = gateway === "SIRO" ? "cbu" : "card";

        if (gateway === "MOBBEX") {
          return {
            ...prev,
            gateway,
            planId: undefined,
            paymentMethod: "card",
          };
        }

        const firstLocalPlan = localPlans[0];
        return {
          ...prev,
          gateway,
          paymentMethod,
          planId: firstLocalPlan?.id,
          plan: firstLocalPlan?.name ?? prev.plan,
        };
      }

      if (name === "planId") {
        const selectedPlan = localPlans.find(
          (plan) => plan.id === Number(value),
        );
        return {
          ...prev,
          planId: selectedPlan?.id,
          plan: selectedPlan?.name ?? prev.plan,
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleCashChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setCashData((prev) => {
      if (name === "paidAmount" || name === "discountAmount") {
        return {
          ...prev,
          [name]: parseCurrencyInput(value),
        };
      }

      if (name === "promoterId") {
        const selectedPromoter = localPromoters.find(
          (promoter) => promoter.id === Number(value),
        );

        return {
          ...prev,
          promoterId: selectedPromoter?.id,
          promoterName: selectedPromoter?.name ?? prev.promoterName,
          cityId: selectedPromoter?.cityId ?? null,
          city: selectedPromoter?.city?.name ?? cityOptions[0],
        };
      }

      if (name === "planId") {
        const selectedPlan = localPlans.find(
          (plan) => plan.id === Number(value),
        );
        return {
          ...prev,
          planId: selectedPlan?.id,
          plan: selectedPlan?.name ?? prev.plan,
          planAmount: selectedPlan
            ? Number(selectedPlan.monthlyFee)
            : prev.planAmount,
          paidAmount: 0,
          discountAmount: 0,
          discountReason: "",
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleMobbexPlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subscription = mobbexSubscriptions.find(
      (item) => item.uid === e.target.value,
    );

    setAutoData((prev) => ({
      ...prev,
      mobbexSubscriptionId: e.target.value,
      mobbexWebhook: subscription?.webhook ?? "",
      plan: subscription?.name ?? prev.plan,
    }));
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadLocalPlans = async () => {
      setIsLoadingLocalPlans(true);
      setLocalPlansError("");

      try {
        const items = await plansService.list();
        if (cancelled) {
          return;
        }

        const activePlans = items.filter((plan) => plan.isActive);
        setLocalPlans(activePlans);

        const firstPlan = activePlans[0];

        if (firstPlan) {
          setAutoData((prev) => {
            if (prev.gateway === "MOBBEX" || prev.planId) {
              return prev;
            }

            return {
              ...prev,
              planId: firstPlan.id,
              plan: firstPlan.name,
            };
          });

          setCashData((prev) => {
            if (prev.planId) {
              return prev;
            }

            return {
              ...prev,
              planId: firstPlan.id,
              plan: firstPlan.name,
              planAmount: Number(firstPlan.monthlyFee),
            };
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLocalPlans([]);
        setLocalPlansError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los planes locales.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingLocalPlans(false);
        }
      }
    };

    const loadPromoters = async () => {
      setIsLoadingPromoters(true);
      setPromotersError("");

      try {
        const items = await promotersService.list();
        if (cancelled) {
          return;
        }

        const activePromoters = items.filter((promoter) => promoter.isActive);
        setLocalPromoters(activePromoters);

        const firstPromoter = activePromoters[0];
        if (firstPromoter) {
          setCashData((prev) => {
            if (prev.promoterId) {
              return prev;
            }

            return {
              ...prev,
              promoterId: firstPromoter.id,
              promoterName: firstPromoter.name,
              cityId: firstPromoter.cityId ?? null,
              city: firstPromoter.city?.name ?? cityOptions[0],
            };
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLocalPromoters([]);
        setPromotersError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los promotores.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingPromoters(false);
        }
      }
    };

    void loadLocalPlans();
    void loadPromoters();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (mode !== "automatic") {
      return;
    }

    if (autoData.gateway !== "PAYWAY" || autoData.deviceFingerprintId) {
      return;
    }

    setAutoData((prev) => {
      if (prev.gateway !== "PAYWAY" || prev.deviceFingerprintId) {
        return prev;
      }

      return {
        ...prev,
        deviceFingerprintId: getOrCreatePaywayDeviceFingerprintId(),
      };
    });
  }, [mode, autoData.gateway, autoData.deviceFingerprintId]);

  useEffect(() => {
    if (mode !== "automatic" || autoData.gateway === "MOBBEX") {
      return;
    }

    if (autoData.planId || localPlans.length === 0) {
      return;
    }

    const firstPlan = localPlans[0];
    setAutoData((prev) => ({
      ...prev,
      planId: firstPlan.id,
      plan: firstPlan.name,
    }));
  }, [mode, autoData.gateway, autoData.planId, localPlans]);

  useEffect(() => {
    if (mode !== "cash") {
      return;
    }

    if (cashData.planId || localPlans.length === 0) {
      return;
    }

    const firstPlan = localPlans[0];
    setCashData((prev) => ({
      ...prev,
      planId: firstPlan.id,
      plan: firstPlan.name,
      planAmount: Number(firstPlan.monthlyFee),
      paidAmount: 0,
      discountAmount: 0,
    }));
  }, [mode, cashData.planId, localPlans]);

  useEffect(() => {
    if (!isOpen || mode !== "automatic" || autoData.gateway !== "MOBBEX") {
      return;
    }

    let cancelled = false;

    const loadSubscriptions = async () => {
      setIsLoadingMobbexSubscriptions(true);
      setMobbexSubscriptionsError("");

      try {
        const items = await mobbexService.searchSubscriptions();
        if (cancelled) {
          return;
        }

        setMobbexSubscriptions(items);
        setAutoData((prev) => {
          const selected = items.find(
            (item) => item.uid === prev.mobbexSubscriptionId,
          );

          if (selected) {
            return {
              ...prev,
              plan: selected.name,
              mobbexWebhook: selected.webhook,
            };
          }

          const first = items[0];
          if (!first) {
            return {
              ...prev,
              mobbexSubscriptionId: "",
              mobbexWebhook: "",
            };
          }

          return {
            ...prev,
            plan: first.name,
            planId: undefined,
            mobbexSubscriptionId: first.uid,
            mobbexWebhook: first.webhook,
          };
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setMobbexSubscriptions([]);
        setMobbexSubscriptionsError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los planes de Mobbex.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingMobbexSubscriptions(false);
        }
      }
    };

    void loadSubscriptions();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, autoData.gateway]);

  useEffect(() => {
    if (mode !== "automatic" || autoData.paymentMethod !== "card") {
      setDetectedCardBrand("");
      setDetectedCardType(null);
      setDetectedPaywayMethodId(null);
      return;
    }

    const digits = autoData.cardNumber.replace(/\D/g, "");

    if (digits.length < 4) {
      setDetectedCardBrand("");
      setDetectedCardType(null);
      setDetectedPaywayMethodId(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await paymentsService.detectCardBrand(
          autoData.cardNumber,
        );

        if (!cancelled) {
          setDetectedCardBrand(response.brand ?? "");
          setDetectedCardType(digits.length >= 6 ? response.type : null);
          setDetectedPaywayMethodId(digits.length >= 6 ? response.paywayPaymentMethodId : null);
        }
      } catch {
        if (!cancelled) {
          setDetectedCardBrand("");
          setDetectedCardType(null);
          setDetectedPaywayMethodId(null);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [mode, autoData.paymentMethod, autoData.cardNumber]);

  const handleMemberDraftChange = (field: keyof CashMember, value: string) => {
    setMemberDraft((prev) => ({ ...prev, [field]: value }));
    if (field === "dni") {
      setMemberFormError("");
    }
  };

  const formatDateForInput = (dateString: string | undefined | null) => {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const pad = (value: number) => String(value).padStart(2, "0");
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());

    return `${year}-${month}-${day}`;
  };

  const confirmExistingAffiliateWithDni = async (
    dni: string,
    context: "auto" | "member",
  ) => {
    const normalizedDni = normalizeDni(dni);
    if (!normalizedDni) {
      return true;
    }

    try {
      const existingAffiliates =
        await affiliatesService.findByDocumentNumber(normalizedDni);

      if (existingAffiliates.length === 0) {
        return true;
      }

      const [affiliate] = existingAffiliates;
      return new Promise<boolean>((resolve) => {
        duplicateDniResolver.current = resolve;
        setDuplicateDniDialog({
          context,
          dni: normalizedDni,
          affiliate,
        });
      });
    } catch (error) {
      console.error("Error verificando afiliado existente:", error);
      return true;
    }
  };

  const closeDuplicateDniDialog = () => {
    setDuplicateDniDialog(null);
    duplicateDniResolver.current = null;
  };

  const handleConfirmDuplicateDni = async () => {
    if (duplicateDniDialog) {
      const affiliate = duplicateDniDialog.affiliate;
      const context = duplicateDniDialog.context;

      await affiliatesService.removeById(affiliate.id);

      if (context === "auto") {
        setAutoData((prev) => ({
          ...prev,
          firstName: affiliate.firstName,
          lastName: affiliate.lastName,
          dni: affiliate.documentNumber,
        }));
        setAutoError("");
      } else {
        setMemberDraft((prev) => ({
          ...prev,
          firstName: affiliate.firstName,
          lastName: affiliate.lastName,
          birthDate: formatDateForInput(affiliate.birthDate) || prev.birthDate,
          dni: affiliate.documentNumber,
          address: affiliate.address || "",
          email: affiliate.email || "",
          phone: affiliate.phone || "",
        }));
        setMemberFormError("");
      }

      duplicateDniResolver.current?.(true);
      closeDuplicateDniDialog();

      setTimeout(() => {
        const form =
          context === "auto" ? autoFormRef.current : cashFormRef.current;

        if (form) {
          form.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
          );
        }
      }, 100);
    } else {
      duplicateDniResolver.current?.(true);
      closeDuplicateDniDialog();
    }
  };

  const handleCancelDuplicateDni = () => {
    duplicateDniResolver.current?.(false);
    if (duplicateDniDialog?.context === "auto") {
      setAutoError("El DNI ya existe en otro afiliado.");
      setAutoData((prev) => ({ ...prev, dni: "" }));
    } else {
      setMemberFormError("El DNI ya existe en otro afiliado.");
    }
    closeDuplicateDniDialog();
  };

  const handleAutoDniBlur = async () => {
    if (!autoData.dni.trim()) {
      return;
    }

    const confirmed = await confirmExistingAffiliateWithDni(
      autoData.dni,
      "auto",
    );
    if (!confirmed) {
      return;
    }

    setAutoError("");
  };

  const handleMemberDniBlur = async () => {
    if (!memberDraft.dni.trim()) {
      return;
    }

    const confirmed = await confirmExistingAffiliateWithDni(
      memberDraft.dni,
      "member",
    );
    if (!confirmed) {
      return;
    }

    setMemberFormError("");
  };

  const openMemberForm = (member?: CashMember) => {
    setMemberFormError("");

    if (member) {
      setMemberDraft(member);
      setEditingMemberId(member.id);
    } else {
      setMemberDraft(emptyCashMember);
      setEditingMemberId(null);
    }

    setShowMemberForm(true);
  };

  const closeMemberForm = () => {
    setShowMemberForm(false);
    setEditingMemberId(null);
    setMemberDraft(emptyCashMember);
    setMemberFormError("");
  };

  const normalizeDni = (dni: string) => dni.replace(/\D/g, "");

  const saveMember = async () => {
    const firstName = memberDraft.firstName.trim();
    const lastName = memberDraft.lastName.trim();
    const dniValue = normalizeDni(memberDraft.dni);
    const birthDate = memberDraft.birthDate.trim();

    if (!firstName || !lastName || !dniValue || !birthDate) {
      setMemberFormError(
        "Completa Nombre, Apellido, DNI y Fecha de Nacimiento antes de guardar.",
      );
      return;
    }

    const parsedDate = new Date(birthDate);
    if (Number.isNaN(parsedDate.getTime())) {
      setMemberFormError("La Fecha de Nacimiento no es válida.");
      return;
    }

    const confirmed = await confirmExistingAffiliateWithDni(dniValue, "member");
    if (!confirmed) {
      return;
    }

    const duplicate = members.some(
      (member) =>
        normalizeDni(member.dni) === dniValue && member.id !== editingMemberId,
    );

    if (duplicate) {
      setMemberFormError("El DNI ya existe en otro miembro.");
      return;
    }

    const newMember = {
      ...memberDraft,
      firstName,
      lastName,
      dni: dniValue,
      birthDate: birthDate,
      address: memberDraft.address.trim(),
      email: memberDraft.email.trim(),
      phone: memberDraft.phone.trim(),
      inscriptionDate: memberDraft.inscriptionDate.trim(),
    };

    if (editingMemberId !== null) {
      setMembers((prev) =>
        prev.map((member) =>
          member.id === editingMemberId
            ? { ...newMember, id: editingMemberId }
            : member,
        ),
      );
    } else {
      setMembers((prev) => [...prev, { ...newMember, id: memberIdCounter }]);
      setMemberIdCounter((prev) => prev + 1);
    }

    closeMemberForm();
  };

  const removeMember = (memberId: number) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const validateCashMembers = (): string | null => {
    if (members.length === 0) {
      return "Agregá al menos un miembro al grupo.";
    }

    const seen = new Set<string>();

    for (let index = 0; index < members.length; index += 1) {
      const member = members[index];
      const firstName = member.firstName.trim();
      const lastName = member.lastName.trim();
      const dniValue = normalizeDni(member.dni);
      const birthDate = member.birthDate.trim();

      if (!firstName || !lastName || !dniValue || !birthDate) {
        return `Completa Nombre, Apellido, DNI y Fecha de Nacimiento en el miembro ${index + 1}.`;
      }

      const parsedDate = new Date(birthDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return `La Fecha de Nacimiento del miembro ${index + 1} no es válida.`;
      }

      if (seen.has(dniValue)) {
        return `El DNI del miembro ${index + 1} coincide con otro miembro.`;
      }

      seen.add(dniValue);
    }

    return null;
  };

  const handleSubmitAuto = async (e: React.FormEvent) => {
    e.preventDefault();
    setAutoError("");
    setIsSubmitting(true);

    try {
      const submitData = {
        mode: "automatic" as const,
        ...autoData,
        paywayPaymentMethodId: detectedPaywayMethodId ?? undefined,
      };

      const result = await onSubmit(submitData);

      if (autoData.gateway === "MOBBEX" && result?.mobbexSourceUrl) {
        setGeneratedMobbexLink(result.mobbexSourceUrl);
        setCopyFeedback("");
        return;
      }

      resetForms();
      onClose();
    } catch (error: any) {
      const msg =
        error?.message ||
        (autoData.gateway === "SIRO"
          ? "No se pudo registrar el CBU. Verificá que sea un CBU bancario real (no un CVU de billetera digital)."
          : "No se pudo crear el grupo. Revisá los datos e intentá de nuevo.");
      setAutoError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setCashError("");

    const validationError = validateCashMembers();
    if (validationError) {
      setCashError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        mode: "cash" as const,
        ...cashData,
        members,
      };

      await onSubmit(submitData);
      resetForms();
      onClose();
    } catch (error: any) {
      setCashError(error?.message || "No se pudo crear el grupo. Revisá los datos e intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetForms();
    }
  }, [isOpen]);

  const resetForms = () => {
    setAutoData({
      gateway: paymentGatewayOptions[0].value,
      plan: localPlans[0]?.name ?? "",
      planId: localPlans[0]?.id,
      mobbexSubscriptionId: "",
      mobbexWebhook: "",
      paymentMethod: "card",
      cbu: "",
      cardNumber: "",
      cardMonth: "",
      cardYear: "",
      cardCvv: "",
      firstName: "",
      lastName: "",
      dni: "",
      deviceFingerprintId: "",
    });
    setMobbexSubscriptions([]);
    setLocalPlansError("");
    setMobbexSubscriptionsError("");
    setGeneratedMobbexLink("");
    setCopyFeedback("");
    setDetectedCardBrand("");
    setDetectedCardType(null);
    setDetectedPaywayMethodId(null);
    setCashData({
      promoterId: localPromoters[0]?.id,
      promoterName: localPromoters[0]?.name ?? "",
      seller: "",
      plan: localPlans[0]?.name ?? "",
      planId: localPlans[0]?.id,
      planAmount: localPlans[0] ? Number(localPlans[0].monthlyFee) : undefined,
      paidAmount: 0,
      discountAmount: 0,
      discountReason: "",
      city: localPromoters[0]?.city?.name ?? cityOptions[0],
      cityId: localPromoters[0]?.cityId ?? null,
    });
    setMembers([]);
    setMemberDraft(emptyCashMember);
    setShowMemberForm(false);
    setMemberFormError("");
    setCashError("");
    setEditingMemberId(null);
    setMemberIdCounter(1);
  };

  if (!isOpen) return null;

  const planAmount = Number(cashData.planAmount ?? 0);
  const paidAmount = Number(cashData.paidAmount ?? 0);
  const discountAmount = Number(cashData.discountAmount ?? 0);
  const coveredAmount = paidAmount + discountAmount;
  const remainingAmount = Math.max(0, planAmount - coveredAmount);
  const isPartialCashPayment =
    planAmount > 0 && coveredAmount > 0 && coveredAmount < planAmount;
  const isCompleteCashPayment = planAmount > 0 && coveredAmount === planAmount;
  const exceedsPlanAmount = planAmount > 0 && coveredAmount > planAmount;

  const handleCopyMobbexLink = async () => {
    if (!generatedMobbexLink) {
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(generatedMobbexLink);
        setCopyFeedback("Link copiado.");
        return;
      }

      setCopyFeedback("Copiá el link manualmente.");
    } catch {
      setCopyFeedback("No se pudo copiar automáticamente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Crear Grupo de Afiliados
          </h2>
          <button
            onClick={handleClose}
            type="button"
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex flex-col gap-3 px-6 pt-6 pb-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3 flex-1">
            <button
              type="button"
              onClick={() => setMode("automatic")}
              className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
                mode === "automatic"
                  ? "bg-slate-600 hover:bg-slate-700 text-white shadow-md"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
            >
              AUTOMÁTICO
            </button>
            <button
              type="button"
              onClick={() => setMode("cash")}
              className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
                mode === "cash"
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
            >
              EFECTIVO
            </button>
          </div>
        </div>

        {duplicateDniDialog && (
          <div className="px-6 py-4 border-b border-slate-100 bg-amber-50">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                Afiliado existente encontrado
              </p>
              <p className="text-sm text-amber-700">
                Ya existe un afiliado con DNI {duplicateDniDialog.dni}:{" "}
                {duplicateDniDialog.affiliate.firstName}{" "}
                {duplicateDniDialog.affiliate.lastName}. Está asociado al grupo
                #{duplicateDniDialog.affiliate.familiarGroupId}.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelDuplicateDni}
                  className="h-10 w-full sm:w-auto border border-amber-300 text-amber-900 bg-white hover:bg-amber-100 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDuplicateDni}
                  className="h-10 w-10 sm:w-auto bg-amber-900 hover:bg-amber-800 text-white rounded-xl font-semibold transition-colors"
                >
                  Continuar igualmente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Automatic Payment Form */}
        {mode === "automatic" && (
          <form
            ref={autoFormRef}
            onSubmit={handleSubmitAuto}
            className="px-6 py-6 space-y-6"
          >
            {/* Card type selection */}
            {/* Gateway and plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Gateway
                </label>
                <select
                  name="gateway"
                  value={autoData.gateway}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentGatewayOptions.map((gateway) => (
                    <option key={gateway.value} value={gateway.value}>
                      {gateway.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {autoData.gateway === "MOBBEX" ? "Plan de Mobbex" : "Plan"}
                </label>
                {autoData.gateway === "MOBBEX" ? (
                  <select
                    value={autoData.mobbexSubscriptionId}
                    onChange={handleMobbexPlanChange}
                    disabled={
                      isLoadingMobbexSubscriptions ||
                      mobbexSubscriptions.length === 0
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {mobbexSubscriptions.map((subscription) => (
                      <option key={subscription.uid} value={subscription.uid}>
                        {subscription.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    name="planId"
                    value={autoData.planId ? String(autoData.planId) : ""}
                    onChange={handleAutoChange}
                    disabled={isLoadingLocalPlans || localPlans.length === 0}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isLoadingLocalPlans && (
                      <option value="">Cargando planes...</option>
                    )}
                    {!isLoadingLocalPlans && localPlans.length === 0 && (
                      <option value="">No hay planes activos</option>
                    )}
                    {localPlans.map((plan) => (
                      <option key={plan.id} value={String(plan.id)}>
                        {formatPlanLabel(plan)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {autoData.gateway !== "MOBBEX" && localPlansError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {localPlansError}
              </div>
            )}

            {autoData.gateway === "MOBBEX" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-2">
                <p>
                  Mobbex no pide la tarjeta en este formulario. Después de crear
                  el grupo, se abre el checkout hospedado para que el titular
                  complete la suscripción.
                </p>
                {isLoadingMobbexSubscriptions && (
                  <p>Cargando planes de Mobbex...</p>
                )}
                {mobbexSubscriptionsError && <p>{mobbexSubscriptionsError}</p>}
                {!isLoadingMobbexSubscriptions &&
                  !mobbexSubscriptionsError &&
                  autoData.mobbexSubscriptionId && (
                    <p>Plan seleccionado: {autoData.plan}</p>
                  )}
              </div>
            )}

            {generatedMobbexLink && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-900">
                  Link de suscripcion generado para enviar al cliente.
                </p>
                <input
                  type="text"
                  readOnly
                  value={generatedMobbexLink}
                  onFocus={(event) => event.currentTarget.select()}
                  className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl bg-white text-sm text-slate-700"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCopyMobbexLink}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Copiar link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForms();
                      onClose();
                    }}
                    className="h-10 px-4 border border-emerald-300 text-emerald-800 font-semibold rounded-xl transition-colors hover:bg-emerald-100"
                  >
                    Cerrar
                  </button>
                </div>
                {copyFeedback && (
                  <p className="text-sm text-emerald-800">{copyFeedback}</p>
                )}
              </div>
            )}

            {/* Payment method */}
            {autoData.gateway !== "MOBBEX" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Método de pago
                </label>
                <input
                  value={autoData.gateway === "SIRO" ? "CBU" : "Tarjeta"}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-600"
                />
              </div>
            )}

            {/* Card details */}
            {autoData.paymentMethod === "card" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={autoData.cardNumber}
                      onChange={handleAutoChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {detectedCardBrand && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-emerald-700">
                          Marca detectada: {detectedCardBrand}
                          {detectedCardType === "credit" && " · Crédito"}
                          {detectedCardType === "debit" && " · Débito"}
                          {detectedCardType === "prepaid" && " · Prepaga"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Código del dorso (***)
                    </label>
                    <input
                      type="text"
                      name="cardCvv"
                      value={autoData.cardCvv}
                      onChange={handleAutoChange}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Mes
                    </label>
                    <input
                      type="text"
                      name="cardMonth"
                      value={autoData.cardMonth}
                      onChange={handleAutoChange}
                      placeholder="MM"
                      maxLength={2}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Año
                    </label>
                    <input
                      type="text"
                      name="cardYear"
                      value={autoData.cardYear}
                      onChange={handleAutoChange}
                      placeholder="YY"
                      maxLength={2}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {autoData.paymentMethod === "cbu" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  CBU
                </label>
                <input
                  type="text"
                  name="cbu"
                  value={autoData.cbu}
                  onChange={handleAutoChange}
                  placeholder="Ingresá el CBU"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Personal info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nombres
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={autoData.firstName}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={autoData.lastName}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  DNI (Titular)
                </label>
                <input
                  type="text"
                  name="dni"
                  value={autoData.dni}
                  onChange={handleAutoChange}
                  onBlur={handleAutoDniBlur}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {autoError && (
                  <p className="mt-2 text-sm text-rose-700">{autoError}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (autoData.gateway === "MOBBEX" &&
                    (isLoadingMobbexSubscriptions ||
                      !autoData.mobbexSubscriptionId ||
                      Boolean(generatedMobbexLink)))
                }
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Procesando...
                  </>
                ) : autoData.gateway === "MOBBEX" ? (
                  "GENERAR LINK DE MOBBEX"
                ) : (
                  "COBRAR"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Cash Payment Form */}
        {mode === "cash" && (
          <form
            ref={cashFormRef}
            onSubmit={handleSubmitCash}
            className="px-6 py-6 space-y-6"
          >
            {cashError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {cashError}
              </div>
            )}

            {/* Top selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Promotor
                </label>
                <select
                  name="promoterId"
                  value={cashData.promoterId ? String(cashData.promoterId) : ""}
                  onChange={handleCashChange}
                  disabled={isLoadingPromoters || localPromoters.length === 0}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isLoadingPromoters && (
                    <option value="">Cargando promotores...</option>
                  )}
                  {!isLoadingPromoters && localPromoters.length === 0 && (
                    <option value="">No hay promotores activos</option>
                  )}
                  {localPromoters.map((promoter) => (
                    <option key={promoter.id} value={String(promoter.id)}>
                      {promoter.name}
                    </option>
                  ))}
                </select>
                {promotersError && (
                  <p className="mt-2 text-xs text-amber-700">
                    {promotersError}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Vendedor (opcional)
                </label>
                <select
                  name="seller"
                  value={cashData.seller ?? ""}
                  onChange={handleCashChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin vendedor (La clinica)</option>
                  {sellerOptions.map((seller) => (
                    <option key={seller} value={seller}>
                      {seller}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Planes
                </label>
                <select
                  name="planId"
                  value={cashData.planId ? String(cashData.planId) : ""}
                  onChange={handleCashChange}
                  disabled={isLoadingLocalPlans || localPlans.length === 0}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isLoadingLocalPlans && (
                    <option value="">Cargando planes...</option>
                  )}
                  {!isLoadingLocalPlans && localPlans.length === 0 && (
                    <option value="">No hay planes activos</option>
                  )}
                  {localPlans.map((plan) => (
                    <option key={plan.id} value={String(plan.id)}>
                      {formatPlanLabel(plan)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ciudad (del promotor)
                </label>
                <input
                  type="text"
                  readOnly
                  value={cashData.city || "Sin ciudad asignada"}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 cursor-not-allowed"
                />
                {cashData.cityId && (
                  <p className="mt-1 text-xs text-slate-500">
                    Ciudad asignada al promotor seleccionado
                  </p>
                )}
                {!cashData.cityId && cashData.promoterId && (
                  <p className="mt-1 text-xs text-amber-600">
                    El promotor seleccionado no tiene ciudad asignada
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Abonado
                </label>
                <input
                  type="text"
                  name="paidAmount"
                  value={cashData.paidAmount ?? ""}
                  onChange={handleCashChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bonificación
                </label>
                <input
                  type="text"
                  name="discountAmount"
                  value={cashData.discountAmount ?? ""}
                  onChange={handleCashChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Saldo restante
                </label>
                <input
                  type="text"
                  readOnly
                  value={planAmount > 0 ? remainingAmount.toFixed(2) : ""}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Motivo bonificación (opcional)
              </label>
              <input
                type="text"
                name="discountReason"
                value={cashData.discountReason ?? ""}
                onChange={handleCashChange}
                placeholder="Ej. Bonificación comercial por alta"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {planAmount > 0 && paidAmount > 0 && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  exceedsPlanAmount
                    ? "border-red-200 bg-red-50 text-red-900"
                    : isPartialCashPayment
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : isCompleteCashPayment
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {exceedsPlanAmount
                  ? "La suma de abonado y bonificación no puede exceder la cuota del plan."
                  : isPartialCashPayment
                    ? `Pago parcial: abonó $${paidAmount.toFixed(2)}, bonificó $${discountAmount.toFixed(2)} y quedan $${remainingAmount.toFixed(2)} pendientes.`
                    : isCompleteCashPayment
                      ? `Pago completo: entre abonado y bonificación se saldó la cuota de $${planAmount.toFixed(2)}.`
                      : "Ingresá el abonado y/o la bonificación para calcular el saldo restante."}
              </div>
            )}

            <div className="border-t border-slate-200 pt-6">
              <div className="mb-4">
                <button
                  type="submit"
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors"
                >
                  CREAR AFILIADO
                </button>
              </div>
              {!showMemberForm && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => openMemberForm()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 text-slate-600 font-semibold rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Agregar Miembro
                  </button>
                </div>
              )}

              {showMemberForm && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingMemberId ? "Editar Miembro" : "Nuevo Miembro"}
                    </h3>
                    <button
                      type="button"
                      onClick={closeMemberForm}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      Cancelar
                    </button>
                  </div>
                  {memberFormError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 mb-4">
                      {memberFormError}
                    </div>
                  )}
                  <p className="text-sm text-slate-600 mb-4">
                    El primer miembro siempre es el titular. Puedes editar al
                    titular desde la lista.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={memberDraft.firstName}
                        onChange={(e) =>
                          handleMemberDraftChange("firstName", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={memberDraft.lastName}
                        onChange={(e) =>
                          handleMemberDraftChange("lastName", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={memberDraft.birthDate}
                        onChange={(e) =>
                          handleMemberDraftChange("birthDate", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        DNI
                      </label>
                      <input
                        type="text"
                        value={memberDraft.dni}
                        onChange={(e) =>
                          handleMemberDraftChange("dni", e.target.value)
                        }
                        onBlur={handleMemberDniBlur}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={memberDraft.address}
                        onChange={(e) =>
                          handleMemberDraftChange("address", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={memberDraft.email}
                        onChange={(e) =>
                          handleMemberDraftChange("email", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={memberDraft.phone}
                        onChange={(e) =>
                          handleMemberDraftChange("phone", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Fecha de Inscripción
                      </label>
                      <input
                        type="date"
                        value={memberDraft.inscriptionDate}
                        onChange={(e) =>
                          handleMemberDraftChange(
                            "inscriptionDate",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={closeMemberForm}
                      className="flex-1 h-10 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="button"
                      onClick={saveMember}
                      className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
                    >
                      {editingMemberId ? "GUARDAR MIEMBRO" : "AGREGAR MIEMBRO"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {members.length > 0 && (
              <div className="space-y-4">
                {members.map((member, index) => (
                  <div
                    key={member.id}
                    className="bg-slate-50 p-6 rounded-xl border border-slate-200"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Miembro N° {index + 1}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {member.firstName || "Sin nombre"} {member.lastName}
                        </p>
                        <p className="text-sm text-slate-600">
                          DNI: {member.dni || "-"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openMemberForm(member)}
                          className="h-10 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
                        >
                          {index === 0 ? "Editar titular" : "Editar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          className="h-10 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Fecha de inscripción
                        </p>
                        <p className="text-sm text-slate-700">
                          {member.inscriptionDate || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Teléfono
                        </p>
                        <p className="text-sm text-slate-700">
                          {member.phone || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Titular
                        </p>
                        <p className="text-sm text-slate-700">
                          {index === 0 ? "Sí" : "No"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AffiliateGroupsCreateModal;
