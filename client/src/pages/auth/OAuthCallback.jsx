import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "../../hooks/useToast";
import { AuthContext } from "../../App";
import { subscribeToPushNotifications } from "../../utils/notifications";
import { jwtDecode } from 'jwt-decode';

export default function OAuthCallback() {
    const navigate = useNavigate();
    const { refreshAuth } = useContext(AuthContext);
    const { showSuccess } = useToast();

    useEffect(() => {
        async function setOAuthLogin() {
            const params = new URLSearchParams(window.location.search);
            const accessToken = params.get('accessToken');
            const refreshToken = params.get('refreshToken');
            const error = params.get('error');

            if (error || !accessToken || !refreshToken) {
                navigate('/login?error=oauth_failed');
                return;
            }

            showSuccess("Login successful!", 1000);

            const user = jwtDecode(accessToken);
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));

            refreshAuth();

            if ("serviceWorker" in navigator && "PushManager" in window) {
                const permissionGranted = await Notification.requestPermission();

                if (
                    permissionGranted === "granted" ||
                    permissionGranted === "default"
                ) {
                    subscribeToPushNotifications(user.user_id, accessToken)
                        .then((success) => {
                            if (!success) {
                                console.error("Push notifications subscription skipped");
                            }
                        })
                        .catch((error) => {
                            console.error(
                                "Error subscribing to push notifications:",
                                error
                            );
                        });
                }
            }

            setTimeout(() => {
                navigate("/chats");
            }, 2000);
        }
        setOAuthLogin();
    }, [navigate, refreshAuth, showSuccess]);

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