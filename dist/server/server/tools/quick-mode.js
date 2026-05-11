export async function handleQuickMode(input) {
    return {
        status: 'triggered',
        message: `Routing intent to bmad-quick-dev: "${input.intent}"`,
    };
}
