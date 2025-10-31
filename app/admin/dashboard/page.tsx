"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface Lead {
  Name: string;
  Email: string;
  Phone: string;
  Message: string;
  Date: string;
  Status: string;
}

interface MediaFile {
  id: string;
  name: string;
  webViewLink?: string;
  createdTime?: string;
  size?: string;
  mimeType?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"leads" | "media" | "messages">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Message form state
  const [messageForm, setMessageForm] = useState({
    to: "",
    message: "",
    type: "sms",
  });

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "leads") {
        const response = await fetch("/api/leads/list", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setLeads(data.leads);
        } else {
          if (response.status === 401) {
            router.push("/admin/login");
            return;
          }
          toast.error("Failed to load leads");
        }
      } else if (activeTab === "media") {
        const response = await fetch("/api/media/list", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setMedia(data.files);
        } else {
          if (response.status === 401) {
            router.push("/admin/login");
            return;
          }
          toast.error("Failed to load media");
        }
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMessage(true);

    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageForm),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Message sent successfully!");
        setMessageForm({ to: "", message: "", type: "sms" });
      } else {
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("File uploaded successfully!");
        loadData();
      } else {
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        toast.error(data.error || "Failed to upload file");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch("/api/media/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("File deleted successfully!");
        loadData();
      } else {
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        toast.error("Failed to delete file");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                View Site
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("leads")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "leads"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Leads
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "media"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Media
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "messages"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Send Message
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading && activeTab !== "messages" ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                {activeTab === "leads" && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Leads</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Message
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {leads.map((lead, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {lead.Name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {lead.Email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {lead.Phone}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                {lead.Message}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(lead.Date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {lead.Status || "New"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {leads.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No leads found</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "media" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold">Media Files</h2>
                      <label className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer">
                        {uploadingFile ? "Uploading..." : "Upload File"}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {media.map((file) => (
                        <div key={file.id} className="border rounded-lg p-4">
                          <h3 className="font-semibold truncate">{file.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {file.size ? `${(parseInt(file.size) / 1024).toFixed(2)} KB` : "Unknown size"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {file.createdTime
                              ? new Date(file.createdTime).toLocaleDateString()
                              : ""}
                          </p>
                          <div className="mt-3 flex space-x-2">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {media.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No media files found</div>
                    )}
                  </div>
                )}

                {activeTab === "messages" && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Send Message</h2>
                    <form onSubmit={handleSendMessage} className="max-w-2xl">
                      <div className="mb-4">
                        <label htmlFor="to" className="block text-gray-700 font-semibold mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          id="to"
                          required
                          value={messageForm.to}
                          onChange={(e) => setMessageForm({ ...messageForm, to: e.target.value })}
                          placeholder="e.g., 919810889150"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="type" className="block text-gray-700 font-semibold mb-2">
                          Message Type *
                        </label>
                        <select
                          id="type"
                          value={messageForm.type}
                          onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="sms">SMS</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">
                          Message *
                        </label>
                        <textarea
                          id="message"
                          required
                          rows={5}
                          value={messageForm.message}
                          onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendingMessage}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? "Sending..." : "Send Message"}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
