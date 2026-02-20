function searchKnowledge(query, knowledge) {
    const q = query.toLowerCase();
    
    const results = knowledge.filter(
        (item) => q.includes(item.topic) || item.content.toLowerCase().includes(q),
    );

    return results.map((item) => item.content).join("\n");
}

module.exports = searchKnowledge;
