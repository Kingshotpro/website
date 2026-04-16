(function() {
    'use strict';

    const STORAGE_KEYS = {
        ACCOUNTS: 'ksp_accounts',
        LAST_FID: 'ksp_last_fid'
    };
    const MAX_ACCOUNTS = 10;
    const SELECTORS = {
        TOPBAR: '#topbar, .topbar',
        SWITCHER_CONTAINER: 'ksp-account-switcher'
    };
    const STYLES = {
        background: '#16181f',
        border: '#2a2d3e',
        text: '#e8e6e3',
        accent: '#f0c040',
        hoverBg: '#1e2030'
    };

    class AccountSwitcher {
        constructor() {
            this.accounts = this.loadAccounts();
            this.currentFid = localStorage.getItem(STORAGE_KEYS.LAST_FID) || '';
            this.container = null;
            this.dropdown = null;
            this.isOpen = false;
            this.init();
        }

        loadAccounts() {
            try {
                const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
                return stored ? JSON.parse(stored) : [];
            } catch {
                return [];
            }
        }

        saveAccounts() {
            localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(this.accounts));
        }

        addAccount(fid, nickname = '') {
            if (!fid || this.accounts.length >= MAX_ACCOUNTS) return false;
            
            const existing = this.accounts.find(acc => acc.fid === fid);
            if (existing) return false;

            this.accounts.push({
                fid,
                nickname: nickname || `Player${this.accounts.length + 1}`,
                added: new Date().toISOString()
            });
            this.saveAccounts();
            return true;
        }

        removeAccount(fid) {
            if (fid === this.currentFid) return false;
            const initialLength = this.accounts.length;
            this.accounts = this.accounts.filter(acc => acc.fid !== fid);
            if (this.accounts.length !== initialLength) {
                this.saveAccounts();
                return true;
            }
            return false;
        }

        switchAccount(fid) {
            if (!this.accounts.find(acc => acc.fid === fid)) return false;
            localStorage.setItem(STORAGE_KEYS.LAST_FID, fid);
            window.location.reload();
            return true;
        }

        getCurrentAccount() {
            return this.accounts.find(acc => acc.fid === this.currentFid) || this.accounts[0];
        }

        createSwitcherButton() {
            const current = this.getCurrentAccount();
            const button = document.createElement('button');
            button.className = 'ksp-switcher-btn';
            button.innerHTML = `
                <span class="ksp-current-name">${current?.nickname || 'No Account'}</span>
                <span class="ksp-arrow">▼</span>
            `;
            button.style.cssText = `
                background: ${STYLES.background};
                border: 1px solid ${STYLES.border};
                color: ${STYLES.text};
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-family: inherit;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
            return button;
        }

        createDropdown() {
            const dropdown = document.createElement('div');
            dropdown.className = 'ksp-accounts-dropdown';
            dropdown.style.cssText = `
                position: absolute;
                top: 100%;
                right: 0;
                background: ${STYLES.background};
                border: 1px solid ${STYLES.border};
                border-radius: 4px;
                min-width: 200px;
                max-height: 400px;
                overflow-y: auto;
                z-index: 500;
                display: none;
                margin-top: 5px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            return dropdown;
        }

        renderDropdown() {
            if (!this.dropdown) return;
            
            const current = this.getCurrentAccount();
            this.dropdown.innerHTML = '';

            this.accounts.forEach(account => {
                const isCurrent = account.fid === current?.fid;
                const item = document.createElement('div');
                item.className = 'ksp-account-item';
                item.style.cssText = `
                    padding: 10px 12px;
                    border-left: 3px solid ${isCurrent ? STYLES.accent : 'transparent'};
                    color: ${STYLES.text};
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid ${STYLES.border};
                    ${isCurrent ? 'font-weight: bold;' : ''}
                `;
                item.innerHTML = `
                    <div>
                        <div class="ksp-account-nickname">${account.nickname}</div>
                        <div class="ksp-account-fid" style="font-size: 12px; opacity: 0.7;">${account.fid}</div>
                    </div>
                    ${!isCurrent ? '<button class="ksp-remove-btn" style="background: none; border: none; color: #ff6b6b; cursor: pointer; padding: 4px;">✕</button>' : ''}
                `;

                if (!isCurrent) {
                    item.querySelector('.ksp-remove-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (this.removeAccount(account.fid)) {
                            this.renderDropdown();
                        }
                    });
                }

                item.addEventListener('mouseenter', () => {
                    item.style.background = STYLES.hoverBg;
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = STYLES.background;
                });

                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('ksp-remove-btn')) {
                        this.switchAccount(account.fid);
                    }
                });

                this.dropdown.appendChild(item);
            });

            const addBtn = document.createElement('button');
            addBtn.className = 'ksp-add-account';
            addBtn.textContent = '+ Add Account';
            addBtn.style.cssText = `
                width: 100%;
                padding: 10px;
                background: ${STYLES.background};
                border: none;
                border-top: 1px solid ${STYLES.border};
                color: ${STYLES.accent};
                cursor: pointer;
                font-family: inherit;
                font-size: 14px;
                text-align: center;
            `;
            addBtn.addEventListener('click', () => this.showAddForm());
            this.dropdown.appendChild(addBtn);
        }

        showAddForm() {
            const form = document.createElement('div');
            form.style.cssText = `
                padding: 12px;
                border-top: 1px solid ${STYLES.border};
            `;
            form.innerHTML = `
                <input type="text" 
                       class="ksp-fid-input" 
                       placeholder="Enter Player ID"
                       style="width: 100%; padding: 8px; margin-bottom: 8px; background: #1e2030; border: 1px solid ${STYLES.border}; color: ${STYLES.text}; border-radius: 3px;">
                <input type="text" 
                       class="ksp-nickname-input" 
                       placeholder="Nickname (optional)" 
                       style="width: 100%; padding: 8px; margin-bottom: 8px; background: #1e2030; border: 1px solid ${STYLES.border}; color: ${STYLES.text}; border-radius: 3px;">
                <div style="display: flex; gap: 8px;">
                    <button class="ksp-submit-btn" style="flex: 1; padding: 8px; background: ${STYLES.accent}; border: none; border-radius: 3px; cursor: pointer;">Add</button>
                    <button class="ksp-cancel-btn" style="flex: 1; padding: 8px; background: ${STYLES.border}; border: none; color: ${STYLES.text}; border-radius: 3px; cursor: pointer;">Cancel</button>
                </div>
            `;

            this.dropdown.appendChild(form);

            const fidInput = form.querySelector('.ksp-fid-input');
            const nicknameInput = form.querySelector('.ksp-nickname-input');
            const submitBtn = form.querySelector('.ksp-submit-btn');
            const cancelBtn = form.querySelector('.ksp-cancel-btn');

            fidInput.focus();

            submitBtn.addEventListener('click', () => {
                const fid = fidInput.value.trim();
                const nickname = nicknameInput.value.trim();
                if (fid) {
                    if (this.addAccount(fid, nickname)) {
                        this.renderDropdown();
                    }
                }
            });

            cancelBtn.addEventListener('click', () => {
                form.remove();
            });

            fidInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitBtn.click();
            });
        }

        toggleDropdown() {
            this.isOpen = !this.isOpen;
            this.dropdown.style.display = this.isOpen ? 'block' : 'none';
            if (this.isOpen) {
                this.renderDropdown();
            }
        }

        closeDropdown() {
            this.isOpen = false;
            if (this.dropdown) {
                this.dropdown.style.display = 'none';
            }
        }

        watchStorageChanges() {
            window.addEventListener('storage', (e) => {
                if (e.key === STORAGE_KEYS.LAST_FID && e.newValue) {
                    const fid = e.newValue;
                    if (!this.accounts.find(acc => acc.fid === fid)) {
                        this.addAccount(fid);
                        this.renderDropdown();
                    }
                }
            });
        }

        attachToTopbar() {
            const topbar = document.querySelector(SELECTORS.TOPBAR);
            if (!topbar) return false;

            this.container = document.createElement('div');
            this.container.id = SELECTORS.SWITCHER_CONTAINER;
            this.container.style.cssText = 'position: relative;';

            const button = this.createSwitcherButton();
            this.dropdown = this.createDropdown();

            this.container.appendChild(button);
            this.container.appendChild(this.dropdown);

            if (topbar.lastChild) {
                topbar.insertBefore(this.container, topbar.lastChild);
            } else {
                topbar.appendChild(this.container);
            }

            document.addEventListener('click', (e) => {
                if (!this.container.contains(e.target)) {
                    this.closeDropdown();
                }
            });

            return true;
        }

        init() {
            if (this.accounts.length > 1 || this.currentFid) {
                if (!this.currentFid && this.accounts.length > 0) {
                    this.currentFid = this.accounts[0].fid;
                    localStorage.setItem(STORAGE_KEYS.LAST_FID, this.currentFid);
                }
                
                if (this.attachToTopbar()) {
                    this.watchStorageChanges();
                }
            }
        }
    }

    window.AccountSwitcher = AccountSwitcher;

    document.addEventListener('DOMContentLoaded', () => {
        new AccountSwitcher();
    });
})();