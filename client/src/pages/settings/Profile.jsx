import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Camera, Edit2, Save } from "lucide-react";
import BottomTabBar from "../../components/common/BottomTabBar";
import PageHeader from "../../components/common/PageHeader";
import ToastContainer from "../../components/common/ToastContainer";
import { useToast } from "../../hooks/useToast";
import useResponsive from "../../hooks/useResponsive";
import {
  fetchPersonalProfile,
  uploadProfilePicture,
  updateUserProfile,
} from "../../utils/api";
import "./Profile.css";

const Profile = ({ isEmbedded: isEmbeddedProp = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isWideScreen = useResponsive();
  const isEmbedded = isEmbeddedProp || location.state?.isEmbedded || false;
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fileInputRef = React.useRef(null);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  useEffect(() => {
    if (!isEmbedded && isWideScreen) {
      navigate("/settings", { state: { selectedSettingId: "profile" } });
    }
  }, [isWideScreen, isEmbedded, navigate]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.user_id;

  const [profileData, setProfileData] = useState({
    fullName: "",
    username: "",
    email: "",
    bio: "",
    avatar: "👨",
    profilePic: null,
  });

  const [editData, setEditData] = useState({ ...profileData });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setError("User not logged in");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPersonalProfile(userId);

        const userData = data.user;

        let profilePicUrl = null;
        if (userData.profile_pic) {
          const filename = userData.profile_pic.split("/uploads/").pop();
          profilePicUrl = `${(import.meta.env.VITE_APP_API_URL || "http://localhost:3001").replace(/\/+$/, "")
            }/uploads/profiles/${filename}`;
        }

        const profile = {
          fullName: userData.full_name || "",
          username: userData.username || "",
          email: userData.email || user.email || "",
          bio: userData.status_message || "",
          avatar: "👨",
          profilePic: profilePicUrl,
        };

        setProfileData(profile);
        setEditData(profile);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, user.email]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    const updatedFields = {};

    if (editData.fullName !== profileData.fullName) {
      updatedFields.full_name = editData.fullName;
    }

    if (editData.username !== profileData.username) {
      updatedFields.username = editData.username;
    }

    if (editData.bio !== profileData.bio) {
      updatedFields.status_message = editData.bio;
    }

    if (Object.keys(updatedFields).length === 0) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(userId, updatedFields);
      showSuccess("Profile updated successfully!");

      setProfileData({ ...editData });
      setIsEditing(false);

      // Update user in localStorage
      try {
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (editData.fullName !== undefined) currentUser.full_name = editData.fullName;
        if (editData.username !== undefined) currentUser.username = editData.username;
        localStorage.setItem("user", JSON.stringify(currentUser));
        window.dispatchEvent(new Event("userUpdated"));
      } catch (storageErr) {
        console.error("Failed to sync user in localStorage:", storageErr);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to update profile. Please try again.";
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({ ...profileData });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const validExtensions = /\.(jpe?g|png|gif|webp)$/i;
    const isValidType =
      validImageTypes.includes(file.type) || validExtensions.test(file.name);

    if (!isValidType) {
      showError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError("Image size should not exceed 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const data = await uploadProfilePicture(file);
      showSuccess("Profile picture updated successfully!");

      if (data.profile_pic) {
        const filename = data.profile_pic.split("/uploads/").pop();
        const newProfilePicUrl = `${(
          import.meta.env.VITE_APP_API_URL || "http://localhost:3001"
        ).replace(/\/+$/, "")}/uploads/profiles/${filename}?t=${Date.now()}`;

        setProfileData((prev) => ({
          ...prev,
          profilePic: newProfilePicUrl,
        }));
        setEditData((prev) => ({
          ...prev,
          profilePic: newProfilePicUrl,
        }));

        // Update local storage user and notify other components
        try {
          const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
          currentUser.profile_pic = data.profile_pic;
          localStorage.setItem("user", JSON.stringify(currentUser));
          window.dispatchEvent(new Event("userUpdated"));
        } catch (storageErr) {
          console.error("Failed to sync user profile picture in localStorage:", storageErr);
        }
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to upload profile picture. Please try again.";
      showError(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="profile-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <PageHeader
        title="Profile"
        onBack={() => {
          if (isEmbedded) {
            navigate(-1);
          } else {
            navigate("/settings");
          }
        }}
        rightAction={
          !isEditing ? (
            <button className="edit-btn" onClick={handleEdit} title="Edit Profile" aria-label="Edit Profile">
              <Edit2 size={20} />
            </button>
          ) : (
            <button className="save-btn" onClick={handleSave} disabled={saving} title="Save Changes" aria-label="Save Changes">
              <Save size={20} />
            </button>
          )
        }
      />

      {loading ? (
        <div className="profile-content">
          <p style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Loading profile...
          </p>
        </div>
      ) : error ? (
        <div className="profile-content">
          <p style={{ textAlign: "center", padding: "40px", color: "#ff4444" }}>
            {error}
          </p>
        </div>
      ) : (
        <div className="profile-content">
          <div className="profile-avatar-section">
            <div
              className="profile-avatar-large"
              style={{ position: "relative" }}
            >
              {profileData.profilePic ? (
                <img
                  src={profileData.profilePic}
                  alt="profile"
                  onError={() => {
                    setProfileData((prev) => ({ ...prev, profilePic: null }));
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span className="avatar-emoji-large">
                  {profileData.fullName
                    ? profileData.fullName.split(" ").length >= 2
                      ? (
                        profileData.fullName.split(" ")[0][0] +
                        profileData.fullName.split(" ")[
                        profileData.fullName.split(" ").length - 1
                        ][0]
                      ).toUpperCase()
                      : profileData.fullName.substring(0, 2).toUpperCase()
                    : profileData.username.substring(0, 2).toUpperCase()}
                </span>
              )}
              {isEditing && (
                <button
                  className="change-avatar-btn"
                  onClick={handleAvatarClick}
                  type="button"
                >
                  <Camera size={20} />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  className="input-field"
                  value={editData.fullName}
                  onChange={handleChange}
                />
              ) : (
                <p className="profile-value">{profileData.fullName}</p>
              )}
            </div>

            <div className="form-group">
              <label>Username</label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  className="input-field"
                  value={editData.username}
                  onChange={handleChange}
                />
              ) : (
                <p className="profile-value">@{profileData.username}</p>
              )}
            </div>

            <div className="form-group">
              <label>Email</label>
              <p className="profile-value">{profileData.email}</p>
            </div>

            <div className="form-group">
              <label>Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  className="input-field textarea-field"
                  value={editData.bio}
                  onChange={handleChange}
                  rows="3"
                />
              ) : (
                <p className="profile-value">{profileData.bio}</p>
              )}
            </div>

            {isEditing && (
              <div className="button-group">
                <button
                  type="button"
                  className="btn-secondary profile-btn-secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary profile-btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isEmbedded && <BottomTabBar activeTab="profile" />}
    </div>
  );
};

export default Profile;
