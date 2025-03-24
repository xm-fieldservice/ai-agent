const marked = {
    parse: function(text) {
        if (!text) return '';
        
        // 基本的 Markdown 解析
        let html = text
            // 处理代码块
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // 处理行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 处理粗体
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // 处理斜体
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // 处理链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            // 处理标题
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // 处理段落
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        return '<p>' + html + '</p>';
    }
}; 