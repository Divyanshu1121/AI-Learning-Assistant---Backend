const PLAN_LIMITS = {
    free: {
        documents: 3,
        summaries: 5,
        flashcards: 3,
        quizzes: 3,
        export: false,
        chat: false
    },
    pro: {
        documents: Infinity,
        summaries: Infinity,
        flashcards: Infinity,
        quizzes: Infinity,
        export: true,
        chat: true
    }
};

exports.checkLimit = (user, feature) => {
    const plan = user.plan || 'free';
    const limits = PLAN_LIMITS[plan];

    if (!limits) return false;

    // Boolean features (e.g., chat, export)
    if (typeof limits[feature] === 'boolean') {
        if (!limits[feature]) {
            throw new Error(`Upgrade to Pro to access ${feature}`);
        }
        return true;
    }

    // Numeric limits
    const usageKey = `${feature}Generated`;
    // Mapping feature name to usage key if inconsistent
    const map = {
        documents: 'documentsUploaded',
        summaries: 'summariesGenerated',
        flashcards: 'flashcardsGenerated',
        quizzes: 'quizzesGenerated'
    };

    const actualUsageKey = map[feature] || usageKey;
    const currentUsage = user.usage?.[actualUsageKey] || 0;

    if (currentUsage >= limits[feature]) {
        throw new Error(`Free plan limit reached for ${feature}. Upgrade to Pro for unlimited access.`);
    }

    return true;
};

exports.incrementUsage = async (user, feature) => {
    const map = {
        documents: 'documentsUploaded',
        summaries: 'summariesGenerated',
        flashcards: 'flashcardsGenerated',
        quizzes: 'quizzesGenerated'
    };
    const usageKey = map[feature];

    if (!usageKey) return;

    if (!user.usage) user.usage = {};
    user.usage[usageKey] = (user.usage[usageKey] || 0) + 1;
    await user.save();
};
