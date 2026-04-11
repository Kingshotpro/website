(function() {
    // Function to get URL parameters
    function getURLParameter(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    // Function to update localStorage for referral count
    function incrementReferralCount(referrerFID) {
        const key = `ksp_referrals_${referrerFID}`;
        const currentCount = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, currentCount + 1);
        return currentCount + 1;
    }

    // Function to handle referral milestones
    function checkReferralMilestones(referralCount) {
        let message = '';
        let xp = 0;
        let title = '';

        switch (referralCount) {
            case 1:
                message = "A new governor entered on your word. Your influence begins.";
                xp = 50;
                break;
            case 3:
                message = "Three governors came because of you. That is not luck. That is trust.";
                xp = 150;
                title = "Recruiter";
                break;
            case 5:
                message = "Your name carries weight now.";
                xp = 200;
                break;
            case 10:
                message = "Ten souls trust your judgment. That is an alliance.";
                xp = 300;
                title = "Ambassador";
                break;
            case 25:
                message = "Twenty-five. You are not most governors.";
                xp = 500;
                title = "Kingmaker";
                break;
            case 50:
                message = "Fifty referrals. You built a movement.";
                xp = 1000;
                break;
        }

        if (message) {
            if (window.AdvisorOrb && window.AdvisorOrb.addAdvisorMsg) {
                window.AdvisorOrb.addAdvisorMsg(message);
            }
            if (window.Advisor && window.Advisor.grantXP) {
                window.Advisor.grantXP(xp);
            }
            if (title) {
                localStorage.setItem('ksp_referral_title', title);
            }
        }
    }

    // Function to create referral section
    function createReferralSection(fid, referralCount, title) {
        const referralDiv = document.createElement('div');
        referralDiv.className = 'orb-referral';

        const referralLink = `kingshotpro.com/?ref=${fid}`;
        referralDiv.innerHTML = `
            <p>Your referral link: <a href="${referralLink}" target="_blank">${referralLink}</a> <button onclick="navigator.clipboard.writeText('${referralLink}')">Copy</button></p>
            <p>${referralCount} governors recruited</p>
            ${title ? `<p>Current title: ${title}</p>` : ''}
        `;

        const advisorPanel = document.querySelector('#sb-advisor');
        if (advisorPanel) {
            advisorPanel.appendChild(referralDiv);
        } else {
            referralDiv.style.position = 'fixed';
            referralDiv.style.bottom = '10px';
            referralDiv.style.right = '10px';
            referralDiv.style.backgroundColor = '#fff';
            referralDiv.style.border = '1px solid #ccc';
            referralDiv.style.padding = '10px';
            document.body.appendChild(referralDiv);
        }
    }

    // On page load, check for ref parameter
    const referrerFID = getURLParameter('ref');
    if (referrerFID) {
        localStorage.setItem('ksp_referrer', referrerFID);
    }

    // Listen for changes in localStorage for ksp_last_fid
    window.addEventListener('storage', function(event) {
        if (event.key === 'ksp_last_fid') {
            const newPlayerFID = event.newValue;
            const storedReferrerFID = localStorage.getItem('ksp_referrer');

            if (storedReferrerFID && storedReferrerFID !== newPlayerFID) {
                const referralCount = incrementReferralCount(storedReferrerFID);
                checkReferralMilestones(referralCount);

                if (window.Advisor && window.Advisor.grantXP) {
                    window.Advisor.grantXP(10);
                }

                localStorage.removeItem('ksp_referrer');
            }

            const referralCount = parseInt(localStorage.getItem(`ksp_referrals_${newPlayerFID}`) || '0', 10);
            const title = localStorage.getItem('ksp_referral_title') || '';
            createReferralSection(newPlayerFID, referralCount, title);
        }
    });
})();