import {
	type QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
	createAddressFn,
	deleteAddressFn,
	setPrimaryAddressFn,
	updateAddressFn,
} from "./address.functions";
import { addressQueryKey } from "./address.queries";
import type { AddressInput } from "./address.schema";

const refresh = (queryClient: QueryClient) =>
	queryClient.invalidateQueries({ queryKey: addressQueryKey });

const showError = () =>
	toast.error("Couldn't update your addresses. Please try again.");

/**
 * Adds an address, or edits one when `id` is given. A failure is not toasted:
 * the form shows it in place, next to the fields that caused it.
 */
export function useSaveAddress() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, address }: { id?: string; address: AddressInput }) =>
			id
				? updateAddressFn({ data: { id, address } })
				: createAddressFn({ data: address }),
		onSuccess: async (_data, { id }) => {
			await refresh(queryClient);
			toast.success(id ? "Address updated" : "Address added");
		},
	});
}

export function useMakePrimaryAddress() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => setPrimaryAddressFn({ data: { id } }),
		onSuccess: async () => {
			await refresh(queryClient);
			toast.success("Primary address updated");
		},
		onError: showError,
	});
}

export function useRemoveAddress() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteAddressFn({ data: { id } }),
		onSuccess: async () => {
			await refresh(queryClient);
			toast.success("Address deleted");
		},
		onError: showError,
	});
}
