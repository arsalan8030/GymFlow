export function inMongoTransaction(session, operation) {
    if (process.env.MONGODB_TRANSACTIONS === "false") {
        return operation();
    }
    return session.withTransaction(operation);
}
