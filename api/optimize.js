// api/optimize.js
module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // Pulled securely from Vercel environment variables

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
  }

  if (!query) {
    return res.status(400).json({ error: 'No SAQL query provided.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `You are a Salesforce CRM Analytics expert. Optimize the following SAQL query for performance and readability. Provide the optimized SAQL code and a brief explanation of the changes made:\n\n${query}`
          }]
        }],
        systemInstruction: {
          role: 'system',
          parts: [{ text: 'Always format the optimized query inside a markdown code block (```saql ... ```).' }]
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API error');
    }

    // Extract the text from the Gemini response
    const textResult = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ result: textResult });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: 'Failed to process the SAQL query.' });
  }
}
