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
  const [activeTab, setActiveTab] = useState<
    "leads" | "media" | "contacts" | "categories" | "templates" | "messages"
  >("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Message form state
  const [messageForm, setMessageForm] = useState({
    to: "",
    message: "",
    type: "whatsapp",
  });
  const [sendMode, setSendMode] = useState<"single" | "category">("single");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [sendingBulk, setSendingBulk] = useState(false);

  // Contacts form state
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    category: "",
    tags: "",
    notes: "",
  });

  // Category form state
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  // Template form state
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    type: "whatsapp",
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
        const response = await fetch("/api/leads/list");
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
        const response = await fetch("/api/media/list");
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
      } else if (activeTab === "contacts") {
        const response = await fetch("/api/contacts/list");
        if (response.ok) {
          const data = await response.json();
          setContacts(data.contacts);
        } else {
          if (response.status === 401) {
            router.push("/admin/login");
            return;
          }
          toast.error("Failed to load contacts");
        }
      } else if (activeTab === "categories") {
        const response = await fetch("/api/categories/list");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories);
        } else {
          if (response.status === 401) {
            router.push("/admin/login");
            return;
          }
          toast.error("Failed to load categories");
        }
      } else if (activeTab === "templates") {
        const response = await fetch("/api/templates/list");
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates);
        } else {
          if (response.status === 401) {
            router.push("/admin/login");
            return;
          }
          toast.error("Failed to load templates");
        }
      } else if (activeTab === "messages") {
        // Preload categories and templates for the send form
        const [catsRes, tempsRes] = await Promise.all([
          fetch("/api/categories/list"),
          fetch("/api/templates/list"),
        ]);
        if (catsRes.ok) {
          const data = await catsRes.json();
          setCategories(data.categories);
        }
        if (tempsRes.ok) {
          const data = await tempsRes.json();
          setTemplates(data.templates);
        }
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
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
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Message sent successfully!");
        setMessageForm({ to: "", message: "", type: "whatsapp" });
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

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingBulk(true);

    try {
      // Fetch contacts for the selected category
      const contactsRes = await fetch('/api/contacts/list');
      if (!contactsRes.ok) {
        if (contactsRes.status === 401) {
          router.push('/admin/login');
          return;
        }
        toast.error('Failed to load contacts');
        return;
      }
      const data = await contactsRes.json();
      const numbers: string[] = (data.contacts || [])
        .filter((c: any) => c.Category === selectedCategoryId)
        .map((c: any) => c.Phone)
        .filter((n: string) => !!n);

      if (numbers.length === 0) {
        toast.error('No contacts found in selected category');
        return;
      }

      const res = await fetch('/api/sms/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toNumbers: numbers, message: messageForm.message, type: messageForm.type }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(`Sent: ${result.summary.sent}, Failed: ${result.summary.failed}`);
        setMessageForm((prev) => ({ ...prev, message: '' }));
      } else {
        toast.error(result.error || 'Bulk send failed');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setSendingBulk(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContact.name,
          phone: newContact.phone,
          category: newContact.category,
          tags: newContact.tags ? newContact.tags.split(',').map((t) => t.trim()) : [],
          notes: newContact.notes,
        }),
      });
      if (res.ok) {
        toast.success('Contact added');
        setNewContact({ name: '', phone: '', category: '', tags: '', notes: '' });
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add contact');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      const res = await fetch('/api/contacts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success('Contact deleted');
        loadData();
      } else {
        toast.error('Failed to delete contact');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.name, description: newCategory.description }),
      });
      if (res.ok) {
        toast.success('Category added');
        setNewCategory({ name: '', description: '' });
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add category');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      const res = await fetch('/api/categories/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success('Category deleted');
        loadData();
      } else {
        toast.error('Failed to delete category');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTemplate.name, content: newTemplate.content, type: newTemplate.type }),
      });
      if (res.ok) {
        toast.success('Template added');
        setNewTemplate({ name: '', content: '', type: 'whatsapp' });
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add template');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      const res = await fetch('/api/templates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success('Template deleted');
        loadData();
      } else {
        toast.error('Failed to delete template');
      }
    } catch {
      toast.error('Network error');
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
                onClick={() => setActiveTab("contacts")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "contacts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Contacts
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "categories"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "templates"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Templates
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

                {activeTab === "contacts" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">Contacts</h2>
                    </div>
                    <form onSubmit={handleCreateContact} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                      <input
                        placeholder="Name"
                        className="px-3 py-2 border rounded"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Phone (e.g., 919810889150)"
                        className="px-3 py-2 border rounded"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        required
                      />
                      <select
                        className="px-3 py-2 border rounded"
                        value={newContact.category}
                        onChange={(e) => setNewContact({ ...newContact, category: e.target.value })}
                      >
                        <option value="">No Category</option>
                        {categories.map((c) => (
                          <option key={c.ID} value={c.Name}>
                            {c.Name}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="Tags (comma separated)"
                        className="px-3 py-2 border rounded"
                        value={newContact.tags}
                        onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                      />
                      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                        Add Contact
                      </button>
                    </form>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {contacts.map((c) => (
                            <tr key={c.ID}>
                              <td className="px-6 py-4 text-sm text-gray-900">{c.Name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{c.Phone}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{c.Category || '-'}</td>
                              <td className="px-6 py-4 text-sm text-right">
                                <button onClick={() => handleDeleteContact(c.ID)} className="text-red-600 hover:underline">
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {contacts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No contacts found</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "categories" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">Categories</h2>
                    </div>
                    <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                      <input
                        placeholder="Category name"
                        className="px-3 py-2 border rounded"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Description"
                        className="px-3 py-2 border rounded"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      />
                      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Category</button>
                    </form>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categories.map((c) => (
                            <tr key={c.ID}>
                              <td className="px-6 py-4 text-sm text-gray-900">{c.Name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{c.Description || '-'}</td>
                              <td className="px-6 py-4 text-sm text-right">
                                <button onClick={() => handleDeleteCategory(c.ID)} className="text-red-600 hover:underline">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {categories.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No categories found</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "templates" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">Templates</h2>
                    </div>
                    <form onSubmit={handleCreateTemplate} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                      <input
                        placeholder="Template name"
                        className="px-3 py-2 border rounded"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        required
                      />
                      <select
                        className="px-3 py-2 border rounded"
                        value={newTemplate.type}
                        onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                      </select>
                      <input
                        placeholder="Template content"
                        className="px-3 py-2 border rounded"
                        value={newTemplate.content}
                        onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                        required
                      />
                      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Template</button>
                    </form>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                            <th className="px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {templates.map((t) => (
                            <tr key={t.ID}>
                              <td className="px-6 py-4 text-sm text-gray-900">{t.Name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{t.Type}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-lg truncate">{t.Content}</td>
                              <td className="px-6 py-4 text-sm text-right">
                                <button onClick={() => handleDeleteTemplate(t.ID)} className="text-red-600 hover:underline">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {templates.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No templates found</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "messages" && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Send Message</h2>
                    <div className="max-w-2xl">
                      <div className="mb-4 flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="sendMode" checked={sendMode === 'single'} onChange={() => setSendMode('single')} />
                          Single number
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="sendMode" checked={sendMode === 'category'} onChange={() => setSendMode('category')} />
                          Category
                        </label>
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">Template</label>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setSelectedTemplateId(id);
                            const t = templates.find((x) => x.ID === id);
                            if (t) {
                              setMessageForm((prev) => ({ ...prev, message: t.Content, type: t.Type || 'whatsapp' }));
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">No template</option>
                          {templates.map((t) => (
                            <option key={t.ID} value={t.ID}>{t.Name} ({t.Type})</option>
                          ))}
                        </select>
                      </div>

                      {sendMode === 'single' && (
                        <form onSubmit={handleSendMessage}>
                          <div className="mb-4">
                            <label htmlFor="to" className="block text-gray-700 font-semibold mb-2">Phone Number *</label>
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
                            <label htmlFor="type" className="block text-gray-700 font-semibold mb-2">Message Type *</label>
                            <select
                              id="type"
                              value={messageForm.type}
                              onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="whatsapp">WhatsApp</option>
                              <option value="sms">SMS</option>
                            </select>
                          </div>

                          <div className="mb-4">
                            <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">Message *</label>
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
                            {sendingMessage ? 'Sending...' : 'Send Message'}
                          </button>
                        </form>
                      )}

                      {sendMode === 'category' && (
                        <form onSubmit={handleSendBulk}>
                          <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                            <select
                              value={selectedCategoryId}
                              onChange={(e) => setSelectedCategoryId(e.target.value)}
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select category</option>
                              {categories.map((c) => (
                                <option key={c.ID} value={c.Name}>{c.Name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">Message Type *</label>
                            <select
                              value={messageForm.type}
                              onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="whatsapp">WhatsApp</option>
                              <option value="sms">SMS</option>
                            </select>
                          </div>

                          <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">Message *</label>
                            <textarea
                              required
                              rows={5}
                              value={messageForm.message}
                              onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={sendingBulk}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {sendingBulk ? 'Sending...' : 'Send to Category'}
                          </button>
                        </form>
                      )}
                    </div>
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
