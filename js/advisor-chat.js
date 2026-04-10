(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const orbPanelInput = document.getElementById('orb-panel-input');

    // Inject the text input and send button
    const chatInputRow = document.createElement('div');
    chatInputRow.className = 'orb-chat-input-row';
    chatInputRow.innerHTML = `
      <input type="text" id="orb-chat-field" placeholder="Ask your advisor..." autocomplete="off">
      <button id="orb-chat-send" class="orb-chat-send-btn">Send</button>
    `;
    orbPanelInput.appendChild(chatInputRow);

    // Inject the energy bar
    const energyBar = document.createElement('div');
    energyBar.id = 'orb-energy-bar';
    energyBar.className = 'orb-energy-wrap';
    orbPanelInput.appendChild(energyBar);

    const chatField = document.getElementById('orb-chat-field');
    const sendButton = document.getElementById('orb-chat-send');

    // Function to handle sending a message
    function sendMessage() {
      const message = chatField.value.trim();
      if (!message) return;

      chatField.value = '';
      window.AdvisorOrb.addUserMsg(message);
      window.AdvisorOrb.addAdvisorMsg('<span class="typing-dots">...</span>');

      const playerContext = {
        state: window.Advisor.getState(),
        tags: window.Advisor.getTags(),
        level: window.Advisor.getLevel(),
        fid: window.Advisor.getFid()
      };

      fetch('https://kingshotpro-api.kingshotpro.workers.dev/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          fid: playerContext.fid,
          playerContext,
          archetype: 'default', // Assuming a default archetype
          advisorName: 'Advisor' // Assuming a default advisor name
        })
      })
      .then(response => response.json())
      .then(data => {
        document.querySelector('.typing-dots').remove();
        if (data.error === 'energy_depleted') {
          window.AdvisorOrb.addAdvisorMsg('Your advisor needs rest. Upgrade to Pro for unlimited counsel.');
          chatField.disabled = true;
          sendButton.disabled = true;
        } else if (data.response) {
          window.AdvisorOrb.addAdvisorMsg(data.response);
          updateEnergyBar(data.energy_remaining);
        }
      })
      .catch(() => {
        document.querySelector('.typing-dots').remove();
        window.AdvisorOrb.addAdvisorMsg('An error occurred. Please try again later.');
      });
    }

    // Function to update the energy bar
    function updateEnergyBar(energyRemaining) {
      if (energyRemaining <= 0) {
        energyBar.innerHTML = 'Your advisor needs rest. Upgrade to Pro for unlimited counsel.';
        chatField.disabled = true;
        sendButton.disabled = true;
      } else {
        energyBar.innerHTML = `${energyRemaining} of 5 remaining today`;
      }
    }

    // Event listeners for send button and Enter key
    sendButton.addEventListener('click', sendMessage);
    chatField.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
  });
})();