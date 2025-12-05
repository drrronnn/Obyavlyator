import { apiClient } from './apiClient';

export const updateListingMetadata = async (
  listingId: string,
  data: { responsible_user_id?: string; status?: string }
) => {
  const response = await apiClient.patch(
    `/listings/${listingId}/metadata`,
    data
  );
  return response.data;
};
