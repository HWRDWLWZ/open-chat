import type { ServiceRetryInterrupt } from "../candidService";
import type {
    CreateChallengeResponse,
    ChallengeAttempt,
    CheckUsernameResponse,
    CurrentUserResponse,
    ConfirmPhoneNumberResponse,
    SubmitPhoneNumberResponse,
    SetUsernameResponse,
    PhoneNumber,
    ResendCodeResponse,
    UsersArgs,
    UsersResponse,
    UserSummary,
    RegisterUserResponse,
    UpgradeStorageResponse,
} from "../../domain/user/user";

export interface IUserIndexClient {
    getCurrentUser: () => Promise<CurrentUserResponse>;
    createChallenge: () => Promise<CreateChallengeResponse>;
    registerUser(
        username: string,
        challengeAttempt: ChallengeAttempt,
        referredBy: string | undefined
    ): Promise<RegisterUserResponse>;
    checkUsername(username: string): Promise<CheckUsernameResponse>;
    setUsername(userId: string, username: string): Promise<SetUsernameResponse>;
    submitPhoneNumber(phoneNumber: PhoneNumber): Promise<SubmitPhoneNumberResponse>;
    resendRegistrationCode(): Promise<ResendCodeResponse>;
    confirmPhoneNumber(code: string): Promise<ConfirmPhoneNumberResponse>;
    getUsers(
        users: UsersArgs,
        allowStale: boolean,
        interrupt?: ServiceRetryInterrupt
    ): Promise<UsersResponse>;
    searchUsers(searchTerm: string, maxResults?: number): Promise<UserSummary[]>;
    upgradeStorage(newLimitBytes: number): Promise<UpgradeStorageResponse>;
}