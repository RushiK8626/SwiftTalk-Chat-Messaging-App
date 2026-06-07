import { useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "../../hooks/useToast";
import { AuthContext } from "../../App";
import { subscribeToPushNotifications } from "../../utils/notifications";
import { jwtDecode } from 'jwt-decode';

export default function OAuthCallback() {
    const navigate = useNavigate();
    const { refreshAuth } = useContext(AuthContext);
    const { showSuccess } = useToast();

    // Capture unstable references so the effect runs exactly once
    const refreshAuthRef = useRef(refreshAuth);
    const showSuccessRef = useRef(showSuccess);
    const hasRun = useRef(false);

    // Keep refs in sync with latest values
    useEffect(() => {
        refreshAuthRef.current = refreshAuth;
        showSuccessRef.current = showSuccess;
    });

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        async function setOAuthLogin() {
            const params = new URLSearchParams(window.location.search);
            const accessToken = params.get('accessToken');
            const refreshToken = params.get('refreshToken');
            const error = params.get('error');

            if (error || !accessToken || !refreshToken) {
                navigate('/login?error=oauth_failed', { replace: true });
                return;
            }

            const user = jwtDecode(accessToken);
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));

            showSuccessRef.current("Login successful!", 1000);
            refreshAuthRef.current();

            // Attempt push notification subscription (fire-and-forget, no retry)
            try {
                if ("serviceWorker" in navigator && "PushManager" in window) {
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        const success = await subscribeToPushNotifications(user.user_id, accessToken);
                        if (!success) {
                            console.warn("Push notifications subscription skipped — push service may be unavailable");
                        }
                    }
                }
            } catch (pushError) {
                console.warn("Push notification setup failed:", pushError.message);
            }

            // Navigate to chats after a short delay to let the toast show
            setTimeout(() => {
                navigate("/chats", { replace: true });
            }, 1500);
        }

        setOAuthLogin();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '20px' }}>
            <div style={{
                width: '44px', height: '44px',
                border: '3px solid #e5e7eb',
                borderTopColor: '#111',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#6b7280', fontSize: '15px' }}>Signing you in...</p>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}