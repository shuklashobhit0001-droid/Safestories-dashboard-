# Pagination for Assigned Clients in AllTherapists.tsx

## Changes Made:

### 1. Added state (line ~77):
```typescript
// Pagination for assigned clients
const [clientsPage, setClientsPage] = useState(1);
const clientsPerPage = 8;
```

### 2. Replace the clients.map() section (around line 1370) with:
```typescript
{clients.length === 0 ? (
  <tr>
    <td colSpan={4} className="text-center py-4 text-gray-400 text-sm">No clients found</td>
  </tr>
) : (
  (() => {
    const startIndex = (clientsPage - 1) * clientsPerPage;
    const endIndex = startIndex + clientsPerPage;
    const paginatedClients = clients.slice(startIndex, endIndex);
    
    return paginatedClients.map((client, index) => {
      const actualIndex = startIndex + index;
      // ... rest of the mapping code, but use actualIndex instead of index
    });
  })()
)}
```

### 3. Add pagination controls after the table (before closing </div>):
```typescript
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {clients.length > clientsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Showing {((clientsPage - 1) * clientsPerPage) + 1} to {Math.min(clientsPage * clientsPerPage, clients.length)} of {clients.length} clients
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setClientsPage(prev => Math.max(1, prev - 1))}
                      disabled={clientsPage === 1}
                      className={`px-3 py-1 rounded ${
                        clientsPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border hover:bg-gray-50'
                      }`}
                    >
                      ←
                    </button>
                    <span className="px-3 py-1">
                      Page {clientsPage} of {Math.ceil(clients.length / clientsPerPage)}
                    </span>
                    <button
                      onClick={() => setClientsPage(prev => Math.min(Math.ceil(clients.length / clientsPerPage), prev + 1))}
                      disabled={clientsPage >= Math.ceil(clients.length / clientsPerPage)}
                      className={`px-3 py-1 rounded ${
                        clientsPage >= Math.ceil(clients.length / clientsPerPage)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border hover:bg-gray-50'
                      }`}
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>
```

This adds pagination with 8 clients per page and arrow navigation.
