import React, { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import AuthContext from "./authProvider";

const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, triggerAuthCheck } = useContext(AuthContext);
	const router = useRouter();

	// Trigger auth check on mount and on route change
	useEffect(() => {
		const handleRouteChange = () => {
			triggerAuthCheck && triggerAuthCheck();
		};
		// Listen for route changes
		router.events.on('routeChangeComplete', handleRouteChange);
		return () => {
			router.events.off('routeChangeComplete', handleRouteChange);
		};
	}, [router, triggerAuthCheck]);

	// Redirect if not authenticated
	useEffect(() => {
		if (isAuthenticated === false) {
			router.replace("/login");
		}
	}, [isAuthenticated, router]);

	if (isAuthenticated === false) return null; // Or a loading spinner
	return children;
};

export default ProtectedRoute;