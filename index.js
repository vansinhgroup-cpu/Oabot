const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const ZALO_OA_TOKEN = process.env.ZALO_OA_TOKEN;

app.post('/webhook', async (req, res) => {
  const event = req.body;
  
  if (event.event_name === 'user_send_text') {
    const userId = event.sender.id;
    const userMessage = event.message.text;
    
    try {
      // Gọi Claude API
      const claudeResponse = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `Bạn là trợ lý tuyển dụng của Vạn Sinh Group. 
          Nhiệm vụ: tư vấn thông tin việc làm, lương, ca làm việc cho người lao động.
          Trả lời ngắn gọn, thân thiện, bằng tiếng Việt.
          Nếu không có thông tin cụ thể, mời khách để lại số điện thoại để được tư vấn trực tiếp.`,
          messages: [{ role: 'user', content: userMessage }]
        },
        {
          headers: {
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const reply = claudeResponse.data.content[0].text;
      
      // Gửi lại Zalo OA
      await axios.post(
        'https://openapi.zalo.me/v3.0/oa/message/cs',
        {
          recipient: { user_id: userId },
          message: { text: reply }
        },
        {
          headers: {
            'access_token': ZALO_OA_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      
    } catch (error) {
      console.error('Lỗi:', error.message);
    }
  }
  
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy trên port ${PORT}`));
