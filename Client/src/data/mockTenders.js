/**
 * Official GeM Baseline Tenders Dataset
 * All dummy and mockup tenders have been removed from the portal.
 * Real tenders are fetched dynamically from the backend API and
 * created/published by authorized procurement officers.
 */

export const mockTenders = [];

export const getTenderById = (id) => {
  if (!id) return null;
  const cleanId = String(id).trim().toLowerCase();
  return (
    mockTenders.find((t) => {
      const tId = String(t.id).toLowerCase();
      const tRef = String(t.referenceNo).toLowerCase();
      const tTdrId = String(t.tenderId).toLowerCase();
      return (
        tId === cleanId ||
        tRef === cleanId ||
        tTdrId === cleanId ||
        (cleanId.length > 3 && (tRef.includes(cleanId) || cleanId.includes(tRef)))
      );
    }) || null
  );
};

export const filterTenders = (category = 'All', status = 'All') => {
  return mockTenders.filter((t) => {
    const matchesCat = category === 'All' || t.category === category;
    const matchesStatus = status === 'All' || t.status === status;
    return matchesCat && matchesStatus;
  });
};

export default mockTenders;
