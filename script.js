document.addEventListener("DOMContentLoaded", () => {
    // Slack Login
    document.getElementById("slack-login").addEventListener("click", (event) => {
        event.preventDefault(); // Prevent default behavior
        window.location.href = "/slack/login"; // Redirect to Slack OAuth URL
    });

    // Fetch Slack Messages
    document.getElementById("fetch-messages").addEventListener("click", async (event) => {
        event.preventDefault(); // Prevent default behavior
        const channelId = document.getElementById("channel-id").value;
        if (!channelId) {
            alert("Please enter a Channel ID");
            return;
        }

        try {
            const response = await fetch(`/slack/messages?channel_id=${channelId}`, {
                credentials: "include",  // Ensure cookies/sessions are sent
            });

            if (!response.ok) throw new Error("Error fetching messages");
            
            const data = await response.json(); // Parse JSON instead of text

			// Ensure messages exist and extract text
			if (data.messages && Array.isArray(data.messages)) {
    			const messageTexts = data.messages.map(msg => msg.text).join("\n"); 
    			document.getElementById("messages").innerText = messageTexts;
			} else {
    			document.getElementById("messages").innerText = "No messages found.";
			}

			
        } catch (error) {
            console.error(error);
            alert("Failed to fetch messages.");
        }
    });

    // Summarize Messages
    document.getElementById("summarize").addEventListener("click", async (event) => {
    event.preventDefault();

    // Fetch the messages text directly
    const messagesText = document.getElementById("messages").innerText.trim();
    
    if (!messagesText) {
        alert("No messages to summarize.");
        return;
    }

    // Convert the plain text into an array of messages
    const messagesArray = messagesText.split("\n").filter(text => text.trim() !== ""); // Split by new lines

    try {
        const response = await fetch("/ai/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: messagesArray }),  // Ensure correct format
        });
        
		// ✅ Log full response for debugging
		const responseText = await response.text();
		console.log("Raw API Response:", responseText);

		if (!response.ok) {
    		console.error("Summarization API Error:", response.status, response.statusText);
    		throw new Error(`Error generating summary: ${responseText}`);
		}


    } catch (error) {
        console.error("Summarization error:", error);
        alert("Failed to summarize messages.");
    }
});



    document.getElementById("create-event").addEventListener("click", async (event) => {
    event.preventDefault();

    const summary = document.getElementById("event-summary").value;
    const startTime = document.getElementById("start-time").value;
    const endTime = document.getElementById("end-time").value;

    if (!summary || !startTime || !endTime) {
        alert("Please fill in all fields");
        return;
    }

    try {
        const response = await fetch("/calendar/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                summary: summary,
                start_time: new Date(startTime).toISOString(),  // Ensures proper format
                end_time: new Date(endTime).toISOString(),
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Error creating event");

        document.getElementById("event-status").innerText = "Event Created Successfully!";
    } catch (error) {
        console.error(error);
        document.getElementById("event-status").innerText = "Failed: " + error.message;
    }
	});
});
