import {
	type QueryClient,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useTranslation } from "#/i18n/translate";
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

/**
 * Adds an address, or edits one when `id` is given. A failure is not toasted:
 * the form shows it in place, next to the fields that caused it.
 */
export function useSaveAddress() {
	const t = useTranslation();
	const queryClient = useQueryClient();
	const createAddress = useServerFn(createAddressFn);
	const updateAddress = useServerFn(updateAddressFn);

	return useMutation({
		mutationFn: ({ id, address }: { id?: string; address: AddressInput }) =>
			id
				? updateAddress({ data: { id, address } })
				: createAddress({ data: address }),
		onSuccess: async (_data, { id }) => {
			await refresh(queryClient);
			toast.success(id ? t("Address updated") : t("Address added"));
		},
	});
}

export function useMakePrimaryAddress() {
	const t = useTranslation();
	const queryClient = useQueryClient();
	const setPrimaryAddress = useServerFn(setPrimaryAddressFn);

	return useMutation({
		mutationFn: (id: string) => setPrimaryAddress({ data: { id } }),
		onSuccess: async () => {
			await refresh(queryClient);
			toast.success(t("Primary address updated"));
		},
		onError: () =>
			toast.error(t("Couldn't update your addresses. Please try again.")),
	});
}

export function useRemoveAddress() {
	const t = useTranslation();
	const queryClient = useQueryClient();
	const deleteAddress = useServerFn(deleteAddressFn);

	return useMutation({
		mutationFn: (id: string) => deleteAddress({ data: { id } }),
		onSuccess: async () => {
			await refresh(queryClient);
			toast.success(t("Address deleted"));
		},
		onError: () =>
			toast.error(t("Couldn't update your addresses. Please try again.")),
	});
}
