# BaseUrl "http://loclahost:8888"

# Route->"/api"

# Route -> "/auth"

# Route -> POST "/login"

            Body {
                email: string,
                password: string,
            }
            response => payload: {
                accessToken: string,
                refreshToken: string,
                user: IUser
            } | payload: { twoFactorCredintals: true, userId: string }

# Route -> POST "/register"

            Body {
                email: string,
                password: string,
                name: string
            }
            response => payload: { accessToken: string, refreshToken: string, user: IUser };

# Route -> POST "/logout"

            user must be authentiacted

# Route -> GET "/me"

            user must be authentiacted
            response => {
                payload: IUser
            }

# Route -> POST "/refresh-token"

            user must be authentiacted
            Body {
                refreshToken: string
            }
            response => payload: {accessToken: string, refreshToken: string}

# Route -> POST "/forgot-password"

            Body {
                email: string,
            }
            response => payload: boolean

# Route -> POST "/reset-password"

            Body {
                newPassword: string
            }
            response => payload: boolean

# Route -> POST "/verify-email"

            Body {
                code: string,
            }
            response => paylaod: boolean

# Route -> POST "/resend-verification-email"

            Body {
                email: string,
            }
            response => payload: null

# Route -> POST "/change-password"

            user must be authentiacted
            Body {
                oldPassword: string,
                newPassword: string,
            }
            response => payload: null

# Route -> PATCH "/update-profile"

            user must be authentiacted
            Body {
                name: string
            }
            response => payload: null

# Route -> DELETE "/"

            user must be authentiacted
            response => payload: null,

# Route -> GET "/oauth/:provider"

            Params: {
                provider: "google" | "github"
            }
            response => payload: {
                accessToken: string,
                refreshToken: string,
                user: IUser
            }

# Route -> GET "/oauth/:provider/callback"

            Params: {
                provider: "google" | "github"
            }
             response => payload: {
                accessToken: string,
                refreshToken: string,
                user: IUser
            }

# Route -> POST "/2fa/setup"

            user must be authentiacted
            response => payload: {
                qrCode: string
                secret: string
            }

# Route -> POST "/2fa/verify"

            Body {
                userId: string,
                token: string
            }
            response => payload: null

# Route -> POST "/2fa/disable"

            Body {
                userId: string,
                token: string
            }
            response => payload: null

# Route -> POST "/2fa/backup-codes"

            user must be authenticated

            response => payload: [
                "a3f9c1b2",
                "9d4e7a01",
                "c8f2b6e3",
                "1a9d4f77",
                "7b2c0a9e",
                "e3d1f8b4",
                "5a6c2d9f",
                "0f9b3c7e"
            ]

# Route -> POST "/2fa/backup-codes/verify"

            Body {
                code: string
            }
            response => payload: null

# Route -> POST "/2fa/backup-codes/regenerate"

            user must be authenticated

            response => payload: [
                "a3f9c1b2",
                "9d4e7a01",
                "c8f2b6e3",
                "1a9d4f77",
                "7b2c0a9e",
                "e3d1f8b4",
                "5a6c2d9f",
                "0f9b3c7e"
            ]

# Route -> POST "/2fa/backup-codes/disable"

            user must be authenticated

            response => payload: null

# Route -> POST "/2fa/backup-codes/enable"

            user must be authenticated

            response => payload: null

# Route -> POST "/2fa/login"

            Body {
                userId: string,
                (backupCode: string) | (token: string)
            }

            response => {accessToken: string, refreshToken: string}
