export enum UserRole {
    SUPER_ADMIN = 'superadmin',
    SCHOOL_ADMIN = 'schooladmin',
    TEACHER = 'teacher',
    ACCOUNTANT = 'accountant',
    TRANSPORT_MANAGER = 'transport_manager',
}

export interface IUser {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    schoolId?: string;
    photo?: string;
    subject?: string;
    isActive: boolean;
    mustChangePassword?: boolean;
    permissions?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ISchool {
    _id: string;
    schoolName: string;
    schoolCode: string;
    logo?: string;
    subscriptionPlan: 'free' | 'pro' | 'enterprise';
    isActive: boolean;
}

export interface IAuthResponse {
    success: boolean;
    token: string;
    refreshToken: string;
    user: IUser;
}

export interface IApiError {
    message: string;
    statusCode?: number;
}
