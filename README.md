# AI-Powered Slack Assistant 🤖

An AI-powered Slack assistant that helps teams streamline communication, summarize messages, and manage tasks efficiently. Built with FastAPI, Slack API, and OpenAI.

---

## Features ✨
- **Slack Integration**: Seamlessly connect with your Slack workspace.
- **Message Summarization**: Automatically summarize long conversations.
- **Task Management**: Create and manage tasks directly from Slack.
- **Google Calendar Integration**: Schedule events and meetings effortlessly.

---

## Technologies Used 🛠️
- **Backend**: FastAPI, Python
- **Frontend**: HTML, CSS, JavaScript
- **APIs**: Slack API, OpenAI API, Google Calendar API
- **Hosting**: Render (Backend), Vercel (Frontend)

---

## Screenshots/GIFs 🖼️

| Slack Login | Message Summarization | Calendar Integration |
|-------------|-----------------------|-----------------------|
| <img src="/slack_login.png" width="300"> | <img src="assets/summarize.png" width="300"> | <img src="assets/calendar.png" width="300"> |

---

## Installation 🛠️

### 1. Clone the Repository
    git clone https://github.com/Akshaysoin07/ai_powered_slack_assistant.git
    cd ai-slack-assistant

### 2\. Install Dependencies

    pip install \-r requirements.txt

### 3\. Set Up Environment Variables

Create a `.env` file in the root directory and add your credentials:

    SLACK\_CLIENT\_ID=your-slack-client-id
    SLACK\_CLIENT\_SECRET=your-slack-client-secret
    OPENAI\_API\_KEY=your-openai-api-key
    GOOGLE\_CLIENT\_ID=your-google-client-id
    GOOGLE\_CLIENT\_SECRET=your-google-client-secret

### 4\. Run the Backend Server

    uvicorn main:app \--reload

### 5\. Run the Frontend

Open `index.html` in your browser or deploy it using a static hosting service.

* * *

Usage 🖥️
---------

1.  **Slack Login**: Click the "Login with Slack" button to connect your workspace.
    
2.  **Fetch Messages**: Enter a channel ID and click "Fetch Messages" to retrieve Slack messages.
    
3.  **Summarize Messages**: Click "Summarize" to generate a summary of the fetched messages.
    
4.  **Create Calendar Event**: Enter event details and click "Create Event" to schedule a Google Calendar event.
    

Contributing 🤝
---------------

1.  **Fork the Repository**: Click "Fork" at the top-right of this repository.
    
2. Create a Branch:

       git checkout -b feature/your-feature
    
3. Commit Changes:

       git commit -m "Add your feature"
    
4. Push to Branch:

       git push origin feature/your-feature
    
6.  **Open a Pull Request**: Go to the original repository and click "New Pull Request".
    

License 📄
----------

This project is licensed under the MIT License. See [LICENSE](/LICENSE) for details.

Acknowledgments 🙏
------------------

*   [Slack API Documentation](https://api.slack.com/)
    
*   [OpenAI API Documentation](https://platform.openai.com/docs/)
    
*   [Google Calendar API Documentation](https://developers.google.com/calendar)
    

Contact 📧
----------

For questions or feedback:📩 [your.email@example.com](https://mailto:akshaysoin1995@gmail.com/)🔗 [LinkedIn Profile](https://linkedin.com/in/your-profile)🐙 [GitHub Profile](https://github.com/Akshaysoin07)
