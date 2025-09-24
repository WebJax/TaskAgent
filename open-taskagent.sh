#!/bin/bash

# open-taskagent.sh - Åbner TaskAgent i browser via Herd

echo "🚀 Åbner TaskAgent i browser..."
echo "📍 URL: http://taskagent.test"
echo ""
echo "💡 Sørg for at projektet er placeret i din Herd mappe"
echo "💡 og at Herd kører med nginx server"
echo ""

# Åbn i standard browser
if command -v open >/dev/null 2>&1; then
    open "http://taskagent.test"
else
    echo "❌ Kunne ikke åbne browser automatisk"
    echo "🌐 Åbn manuelt: http://taskagent.test"
fi