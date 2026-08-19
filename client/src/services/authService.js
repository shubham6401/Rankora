import api from "./api";

export const loginUser=(data)=>{
    return api.post("/auth/login/mediator",data);
}

export const signUpUser=(data)=>{
    return api.post("/auth/signup/mediator",data);
}


export const loginExecutiveUser=(data)=>{
    return api.post("/auth/login/executive",data);
}

export const signUpExecutiveUser=(data)=>{
    return api.post("/auth/signup/executive",data);
}
