import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { cartQuery } from "#/features/cart/cart.queries";
import type { CheckoutView } from "./checkout";
import {
	prepareCheckoutFn,
	submitCheckoutFn,
	uploadProofFn,
} from "./checkout.functions";

type CheckoutAction =
	| { kind: "prepare"; id: string; addressId: string }
	| { kind: "upload"; id: string; file: File }
	| { kind: "submit"; id: string };

/** Keep one request ID across retries so a lost response cannot create a second order. */
export function useCheckout(initialCheckout: CheckoutView | null) {
	const [checkout, setCheckout] = useState(initialCheckout);
	const [step, setStep] = useState(
		initialCheckout?.proofUploaded ? 3 : initialCheckout ? 2 : 1,
	);
	const request = useRef<{ addressId: string; id: string } | null>(null);
	const navigate = useNavigate({ from: "/checkout" });
	const queryClient = useQueryClient();
	const prepare = useServerFn(prepareCheckoutFn);
	const upload = useServerFn(uploadProofFn);
	const submit = useServerFn(submitCheckoutFn);
	const mutation = useMutation({
		scope: { id: "checkout" },
		retry: false,
		mutationFn: (action: CheckoutAction) => {
			switch (action.kind) {
				case "prepare":
					return prepare({
						data: { id: action.id, addressId: action.addressId },
					});
				case "upload": {
					const data = new FormData();
					data.set("id", action.id);
					data.set("file", action.file);
					return upload({ data });
				}
				case "submit":
					return submit({ data: { id: action.id } });
			}
		},
		onSuccess: async (next, action) => {
			setCheckout(next);
			if (action.kind === "prepare") {
				setStep(next.proofUploaded ? 3 : 2);
				await navigate({ search: { checkout: next.id }, replace: true });
			}
			if (action.kind === "submit")
				await queryClient.invalidateQueries({ queryKey: cartQuery.queryKey });
		},
	});

	return {
		checkout,
		step,
		setStep,
		busy: mutation.isPending ? mutation.variables.kind : null,
		error: mutation.error?.message,
		uploadFailed: mutation.isError && mutation.variables?.kind === "upload",
		prepare(addressId: string) {
			if (mutation.isPending) return;
			if (request.current?.addressId !== addressId)
				request.current = { addressId, id: crypto.randomUUID() };
			mutation.mutate({ kind: "prepare", ...request.current });
		},
		upload(file: File) {
			if (checkout && !mutation.isPending)
				mutation.mutate({ kind: "upload", id: checkout.id, file });
		},
		submit() {
			if (checkout && !mutation.isPending)
				mutation.mutate({ kind: "submit", id: checkout.id });
		},
	};
}
