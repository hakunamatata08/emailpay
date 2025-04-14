"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Plus,
  Pencil,
  Trash,
  X,
  UploadSimple
} from "phosphor-react";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// Define Contact interface
interface Contact {
  _id: string;
  userAddress: string;
  name: string;
  email: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, getAddress } = useWeb3Auth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [isContactsLoading, setIsContactsLoading] = useState(true);

  // Form states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactProfilePic, setContactProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [originalContacts, setOriginalContacts] = useState<Contact[]>([]);

  // Fetch contacts from API
  const fetchContacts = useCallback(async (address: string) => {
    setIsContactsLoading(true);
    try {
      console.log("Fetching contacts for address:", address);
      const response = await fetch(`/api/contacts?userAddress=${address}`);
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      // Check if response is OK before attempting to parse JSON
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        console.log("Response not OK. Content-Type:", contentType);

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.log("Error data from API:", errorData);
          throw new Error(errorData.error || "Failed to fetch contacts");
        } else {
          // If response is not JSON, read it as text for error message
          const errorText = await response.text();
          console.log("Error text from API (first 100 chars):", errorText.slice(0, 100));
          throw new Error(`Server error: ${response.status} ${response.statusText}. ${errorText.slice(0, 100)}...`);
        }
      }

      // Only try to parse JSON if we get a successful response
      const data = await response.json();
      console.log("Contacts data received:", data.length, "contacts");
      setContacts(data);
      setOriginalContacts(data); // Store original contacts for search reset

    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Failed to Load Contacts",
        description: "We couldn't load your contacts. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsContactsLoading(false);
    }
  }, [toast]);

  // Get user's wallet address and fetch contacts
  useEffect(() => {
    const initialize = async () => {
      console.log("ContactsPage: Initializing", { isLoading, isAuthenticated });

      // Check authentication and redirect if not authenticated
      if (!isLoading && !isAuthenticated) {
        console.log("ContactsPage: Not authenticated, redirecting to home");
        router.push("/");
        return;
      }

      if (isAuthenticated) {
        try {
          console.log("ContactsPage: User authenticated, getting address");
          const address = await getAddress();
          console.log("ContactsPage: Got wallet address", address ? address.substring(0, 10) + "..." : "null");
          setUserAddress(address);

          if (address) {
            fetchContacts(address);
          } else {
            console.error("ContactsPage: Empty address returned from getAddress()");
            toast({
              title: "Authentication Error",
              description: "Could not retrieve your wallet address. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error initializing contacts page:", error);
          toast({
            title: "Initialization Failed",
            description: "Failed to initialize contacts. Please refresh the page and try again.",
            variant: "destructive",
          });
        }
      }
    };

    initialize();
  }, [isLoading, isAuthenticated, router, getAddress, toast, fetchContacts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if file is too large (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image is too large. Maximum size is 5MB.",
          variant: "destructive",
        });
        return;
      }

      setContactProfilePic(file);

      // Create preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        // Ensure we're not setting an empty string
        const result = reader.result as string;
        if (result && result.length > 0) {
          setPreviewUrl(result);
        } else {
          toast({
            title: "Image Processing Error",
            description: "Failed to process image. Please try another one.",
            variant: "destructive",
          });
          setContactProfilePic(null);
        }
      };
      reader.onerror = () => {
        toast({
          title: "Image Read Error",
          description: "Failed to read image. Please try another one.",
          variant: "destructive",
        });
        setContactProfilePic(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddContact = async () => {
    if (!userAddress) {
      toast({
        title: "User Not Found",
        description: "User address not available. Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    if (!contactName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a valid name for your contact.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(contactEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Adding Contact",
        description: "Please wait while we add your contact...",
        variant: "default",
      });

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          name: contactName,
          email: contactEmail,
          photo: previewUrl // base64 image
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contact");
      }

      const newContact = await response.json();
      setContacts([...contacts, newContact]);
      toast({
        title: "Contact Added",
        description: `${contactName} has been added to your contacts!`,
        variant: "success",
      });
      resetForm();
      setIsAddContactOpen(false);

    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Add Contact Failed",
        description: "Failed to add contact. Please check the information and try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditContact = async () => {
    if (!currentContact || !userAddress) return;

    // Validate inputs
    if (!contactName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a valid name for your contact.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(contactEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Updating Contact",
        description: "Please wait while we update your contact...",
        variant: "default",
      });

      const requestBody: {
        userAddress: string;
        contactId: string;
        name?: string;
        email?: string;
        photo?: string;
      } = {
        userAddress,
        contactId: currentContact._id
      };

      // Only include fields that were changed
      if (contactName !== currentContact.name) {
        requestBody.name = contactName;
      }

      if (contactEmail !== currentContact.email) {
        requestBody.email = contactEmail;
      }

      if (previewUrl && previewUrl !== currentContact.photo) {
        requestBody.photo = previewUrl;
      }

      const response = await fetch('/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update contact");
      }

      const updatedContact = await response.json();

      // Update the contact in the list
      const updatedContacts = contacts.map(contact => {
        if (contact._id === currentContact._id) {
          return updatedContact;
        }
        return contact;
      });

      setContacts(updatedContacts);
      toast({
        title: "Contact Updated",
        description: `${contactName}'s information has been updated!`,
        variant: "success",
      });
      resetForm();
      setIsEditContactOpen(false);

    } catch (error) {
      console.error("Error updating contact:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!userAddress) return;

    try {
      const contactToDelete = contacts.find(contact => contact._id === id);
      const contactName = contactToDelete ? contactToDelete.name : "Contact";

      toast({
        title: "Deleting Contact",
        description: `Removing ${contactName} from your contacts...`,
        variant: "default",
      });

      const response = await fetch(`/api/contacts?userAddress=${userAddress}&contactId=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete contact");
      }

      setContacts(contacts.filter(contact => contact._id !== id));
      toast({
        title: "Contact Deleted",
        description: `${contactName} has been removed from your list.`,
        variant: "success",
      });

    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete contact. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (contact: Contact) => {
    setCurrentContact(contact);
    setContactName(contact.name);
    setContactEmail(contact.email);
    setPreviewUrl(contact.photo || "");
    setIsEditContactOpen(true);
  };

  const resetForm = () => {
    setContactName("");
    setContactEmail("");
    setContactProfilePic(null);
    setPreviewUrl("");
    setCurrentContact(null);
  };

  // Search contacts by email
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search query is empty, reset to show all contacts
      setContacts(originalContacts);
      return;
    }

    if (!userAddress) {
      toast({
        title: "User Not Found",
        description: "User address not available. Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      toast({
        title: "Searching",
        description: `Looking for contacts with name or email matching "${searchQuery}"...`,
        variant: "default",
      });

      const response = await fetch(`/api/contacts/search?userAddress=${userAddress}&query=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to search contacts");
      }

      const searchResults = await response.json();
      setContacts(searchResults);

      if (searchResults.length === 0) {
        toast({
          title: "No Results",
          description: `No contacts found matching "${searchQuery}"`,
          variant: "default",
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${searchResults.length} contact${searchResults.length === 1 ? '' : 's'} matching "${searchQuery}"`,
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error searching contacts:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search contacts. Please try again.",
        variant: "destructive",
      });
      // Reset to original contacts on error
      setContacts(originalContacts);
    } finally {
      setIsSearching(false);
    }
  };

  // Reset search
  const resetSearch = () => {
    setSearchQuery("");
    setContacts(originalContacts);
    toast({
      title: "Search Reset",
      description: "Showing all contacts",
      variant: "default",
    });
  };

  // Loading state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin h-12 w-12 border-4 border-neon-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg backdrop-blur-sm">
          <div className="mb-8">
            <h1 className="text-4xl font-bold gradient-text">My Contacts</h1>
            <p className="text-muted-foreground mt-2">
              Manage your contacts to quickly send crypto to your friends and family.
            </p>
          </div>

          <div className="flex items-center justify-between mb-6">
            {/* Search bar - repositioned and restyled */}
            <div className="flex items-center gap-2 w-2/3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search contacts by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pr-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full flex items-center justify-center"
                    onClick={resetSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-gradient-to-r from-neon-purple to-neon-blue text-white min-w-[100px]"
              >
                {isSearching ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {/* Add Contact button */}
            <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-neon-purple to-neon-blue text-white">
                  <Plus weight="bold" className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to your list for quick crypto transfers.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-2 border-border">
                        <AvatarImage src={previewUrl} />
                        <AvatarFallback className="bg-gradient-to-r from-neon-purple to-neon-blue">
                          <User className="h-12 w-12 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="profile-upload"
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer shadow-md"
                      >
                        <UploadSimple className="h-4 w-4" />
                      </label>
                      <Input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePicChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="name" className="text-right">
                      Name
                    </label>
                    <Input
                      id="name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="email" className="text-right">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddContact}
                    disabled={!contactName || !contactEmail}
                    className="bg-gradient-to-r from-neon-purple to-neon-blue text-white"
                  >
                    Add Contact
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Contact Dialog */}
            <Dialog open={isEditContactOpen} onOpenChange={setIsEditContactOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Contact</DialogTitle>
                  <DialogDescription>
                    Update your contact's information.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-2 border-border">
                        <AvatarImage src={previewUrl} />
                        <AvatarFallback className="bg-gradient-to-r from-neon-purple to-neon-blue">
                          <User className="h-12 w-12 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="edit-profile-upload"
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer shadow-md"
                      >
                        <UploadSimple className="h-4 w-4" />
                      </label>
                      <Input
                        id="edit-profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePicChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-name" className="text-right">
                      Name
                    </label>
                    <Input
                      id="edit-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-email" className="text-right">
                      Email
                    </label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleEditContact}
                    disabled={!contactName || !contactEmail}
                    className="bg-gradient-to-r from-neon-purple to-neon-blue text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isContactsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-10 w-10 border-4 border-neon-purple border-t-transparent rounded-full"></div>
            </div>
          ) : contacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map(contact => (
                  <TableRow key={contact._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.photo} />
                          <AvatarFallback className="bg-gradient-to-r from-neon-purple to-neon-blue">
                            <User className="h-5 w-5 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <span>{contact.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{formatDate(contact.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Navigating to Dashboard",
                              description: `Preparing to send crypto to ${contact.name}`,
                              variant: "default",
                            });
                            router.push(`/dashboard?recipient=${encodeURIComponent(contact.email)}&name=${encodeURIComponent(contact.name)}`);
                          }}
                          className="text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          Send Crypto
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(contact)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteContact(contact._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No contacts yet</h3>
              <p className="text-muted-foreground mb-4">Add your first contact to get started</p>
              <Button
                onClick={() => setIsAddContactOpen(true)}
                className="bg-gradient-to-r from-neon-purple to-neon-blue text-white"
              >
                <Plus weight="bold" className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
