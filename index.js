const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/', (req, res) => {
  const responseBody = {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: "안녕하세요! 챗봇 서버가 정상적으로 실행 중입니다."
          }
        }
      ]
    }
  };
  res.json(responseBody);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
