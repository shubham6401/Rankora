/**
 * Helper to determine if the current user session is authorized with
 * Secret Super Admin (AdminShubhamsecreate) privileges.
 * 
 * True ONLY when:
 * 1. Logged in directly as AdminShubhamsecreate, OR
 * 2. Logged in via Super Admin shadow login / impersonation into an executive or mediator.
 * 
 * False when logged in individually via standard executive or mediator credentials.
 */
export const isSuperAdminSessionActive = () => {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (
            user.isSuperAdmin === true ||
            user.isSuperAdminSession === true ||
            user.impersonatedBy === "AdminShubhamsecreate" ||
            user.username === "AdminShubhamsecreate" ||
            user.name === "AdminShubhamsecreate"
        ) {
            return true;
        }

        const rawBackup = localStorage.getItem("adminBackupSession");
        if (rawBackup) {
            const backup = JSON.parse(rawBackup);
            if (
                backup &&
                backup.user &&
                (backup.user.isSuperAdmin === true ||
                 backup.user.username === "AdminShubhamsecreate" ||
                 backup.user.name === "AdminShubhamsecreate")
            ) {
                return true;
            }
        }

        return false;
    } catch {
        return false;
    }
};

export const getSuperAdminActorInfo = () => {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const rawBackup = localStorage.getItem("adminBackupSession");
        const isImpersonating = Boolean(rawBackup);

        return {
            isSuperAdmin: isSuperAdminSessionActive(),
            isImpersonating,
            currentRole: user.role,
            currentName: user.name,
            teamCode: user.teamCode,
            mediatorCode: user.mediatorCode,
        };
    } catch {
        return { isSuperAdmin: false, isImpersonating: false };
    }
};
