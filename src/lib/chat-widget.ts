/** Inline `<script>` descriptor for the Tawk.to live-chat loader. */
export const chatWidgetScript = (embedUrl: string) => ({
	children: `
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
	var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
	s1.async=true;
	s1.src=${JSON.stringify(embedUrl)};
	s1.charset="UTF-8";
	s1.setAttribute("crossorigin","*");
	s0.parentNode.insertBefore(s1,s0);
})();`,
});

declare global {
	interface Window {
		Tawk_API?: { maximize?: () => void };
	}
}

/** Opens the Tawk.to chat window (a no-op until the widget has loaded). */
export const openChat = () => window.Tawk_API?.maximize?.();
