chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-filter') return;
  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  await chrome.storage.sync.set({ enabled: !enabled });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === 'openOptions') chrome.runtime.openOptionsPage();
});
