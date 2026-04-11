(function() {
    const sidebar = document.querySelector('#sb-advisor');
    const today = new Date().toISOString().split('T')[0];

    function getAllianceData() {
        return JSON.parse(localStorage.getItem('ksp_alliance'));
    }

    function saveAllianceData(data) {
        localStorage.setItem('ksp_alliance', JSON.stringify(data));
    }

    function getCreditsKey(tag, kingdom) {
        return `ksp_alliance_credits_${tag}_${kingdom}`;
    }

    function getCredits(tag, kingdom) {
        return parseInt(localStorage.getItem(getCreditsKey(tag, kingdom))) || 0;
    }

    function setCredits(tag, kingdom, credits) {
        localStorage.setItem(getCreditsKey(tag, kingdom), credits);
    }

    function addCredits(tag, kingdom, amount) {
        const currentCredits = getCredits(tag, kingdom);
        setCredits(tag, kingdom, currentCredits + amount);
    }

    function showLinkSection() {
        const linkSection = document.createElement('div');
        linkSection.className = 'sb-adv-card surface-2 bg border';
        linkSection.style.padding = '10px';
        linkSection.style.borderRadius = '10px';
        linkSection.innerHTML = `
            <h3>Link to Alliance</h3>
            <input type="text" id="alliance-tag" placeholder="Alliance Tag" maxlength="5">
            <input type="number" id="kingdom-number" placeholder="Kingdom Number">
            <select id="role">
                <option value="Member">Member</option>
                <option value="Officer">Officer</option>
                <option value="R4">R4 Leader</option>
                <option value="R5">R5 Leader</option>
            </select>
            <button id="link-button">Link</button>
        `;
        sidebar.insertAdjacentElement('afterend', linkSection);

        document.getElementById('link-button').addEventListener('click', () => {
            const tag = document.getElementById('alliance-tag').value.trim();
            const kingdom = document.getElementById('kingdom-number').value.trim();
            const role = document.getElementById('role').value;
            if (tag && kingdom) {
                saveAllianceData({ tag, kingdom, role });
                alert('Alliance linked successfully!');
                linkSection.remove();
                showAllianceInfo();
            } else {
                alert('Please fill in all fields.');
            }
        });
    }

    function showAllianceInfo() {
        const alliance = getAllianceData();
        if (!alliance) return;

        const { tag, kingdom, role } = alliance;
        const credits = getCredits(tag, kingdom);

        const infoCard = document.createElement('div');
        infoCard.className = 'sb-adv-card surface-2 bg border';
        infoCard.style.padding = '10px';
        infoCard.style.borderRadius = '10px';
        infoCard.innerHTML = `
            <h3>Alliance: ${tag} - Kingdom: ${kingdom}</h3>
            <p>Role: ${role}</p>
            <p>Total Credits: ${credits}</p>
            <a href="alliance/page.html?tag=${tag}&k=${kingdom}">Alliance Page</a>
            <button id="unlink-button">Unlink</button>
            ${role === 'R4' || role === 'R5' ? '<button id="manage-button">Alliance Manager</button>' : ''}
        `;
        sidebar.insertAdjacentElement('afterend', infoCard);

        document.getElementById('unlink-button').addEventListener('click', () => {
            localStorage.removeItem('ksp_alliance');
            infoCard.remove();
            showLinkSection();
        });

        if (role === 'R4' || role === 'R5') {
            document.getElementById('manage-button').addEventListener('click', () => {
                window.location.href = 'alliance/index.html';
            });
        }
    }

    function trackDailyCredit() {
        const alliance = getAllianceData();
        if (!alliance) return;

        const lastCreditDateKey = `ksp_last_credit_date_${alliance.tag}_${alliance.kingdom}`;
        const lastCreditDate = localStorage.getItem(lastCreditDateKey);

        if (lastCreditDate !== today) {
            addCredits(alliance.tag, alliance.kingdom, 1);
            localStorage.setItem(lastCreditDateKey, today);
        }
    }

    function listenForXPGrants() {
        document.addEventListener('xpGrant', (event) => {
            const alliance = getAllianceData();
            if (!alliance) return;

            const xpType = event.detail.type;
            let creditsToAdd = 0;

            switch (xpType) {
                case 'calculator_run':
                    creditsToAdd = 2;
                    break;
                case 'daily_visit':
                    creditsToAdd = 1;
                    break;
                case 'war_table':
                case 'vault_trial':
                    creditsToAdd = 3;
                    break;
                case 'fid_lookup':
                    creditsToAdd = 5;
                    break;
            }

            if (creditsToAdd > 0) {
                addCredits(alliance.tag, alliance.kingdom, creditsToAdd);
            }
        });
    }

    function init() {
        const alliance = getAllianceData();
        if (alliance) {
            showAllianceInfo();
            trackDailyCredit();
        } else {
            showLinkSection();
        }
        listenForXPGrants();
    }

    init();
})();