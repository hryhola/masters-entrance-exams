import { usePracticeSessions } from '../features/practice/usePracticeSessions'

export function StorageNotice() {
  const { storageIssue, dismissStorageIssue } = usePracticeSessions()

  if (!storageIssue) return null

  return (
    <aside className="storage-notice" role="alert">
      <div>
        <strong>Локальне збереження потребує уваги</strong>
        <span>{storageIssue.message}</span>
      </div>
      <button onClick={dismissStorageIssue} type="button">
        Закрити
      </button>
    </aside>
  )
}
