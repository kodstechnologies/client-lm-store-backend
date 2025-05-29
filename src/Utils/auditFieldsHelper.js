

export function applyAuditMiddleware(schema) {
    schema.pre('save', function (next) {
        const now = new Date();

        if (this.isNew) {
            this.AuditFields = {
                createdBy: this._user || 'system',
                createdAt: now,
                updatedBy: null,
                updatedAt: null
            };
        } else {
            this.AuditFields = {
                ...(this.AuditFields || {}),
                updatedBy: this._user || 'system',
                updatedAt: now
            };
        }

        next();
    });

    schema.methods.setUser = function (user) {
        this._user = user;
    };
}
