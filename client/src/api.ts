// Helper ดึง Requester ID มาใส่ Headers (สร้างขึ้นใหม่ตาม Requirement ที่แจ้งให้ใช้)
export const getRequesterHeaders = (): HeadersInit => {
  const requesterId = localStorage.getItem('requesterId') || '';
  return {
    'Content-Type': 'application/json',
    'X-Requester-Id': requesterId,
  };
};

export const getTickets = async (page = 1, limit = 10) => {
  const response = await fetch(`/api/tickets?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getRequesterHeaders(),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch tickets';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // json parse failed
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
