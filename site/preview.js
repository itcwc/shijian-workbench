const tabs = Array.from(document.querySelectorAll('.preview-tabs [role="tab"]'))

function activate(tab) {
  for (const item of tabs) {
    const selected = item === tab
    item.setAttribute('aria-selected', String(selected))
    item.tabIndex = selected ? 0 : -1
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected
  }
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => activate(tab))
  tab.addEventListener('keydown', (event) => {
    let target
    if (event.key === 'Home') target = tabs[0]
    if (event.key === 'End') target = tabs.at(-1)
    if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length]
    if (event.key === 'ArrowLeft') target = tabs[(index - 1 + tabs.length) % tabs.length]
    if (!target) return
    event.preventDefault()
    activate(target)
    target.focus()
  })
}
