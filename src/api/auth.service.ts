import apiClient from "./apiClient";


export const AuthService ={

    async login(username: string, password: string) {
        const { data } = await apiClient.post("/auth/login", {
            username,
            password,
        });
        return data;
    }


}