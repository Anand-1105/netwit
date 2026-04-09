import xlsx from "xlsx";
import { UserCollection } from "../model/filedata.model.js";

export const uploadFile = async (req, res) => {
  try {
    const { event } = req.params;
    if (!event) {
      return res.status(400).json({
        success: false,
        message: "Event id is required",
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON (first row as headers)
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: true });

    if (data.length < 2) {
      return res.status(400).json({ error: "No valid data rows found in the file." });
    }

    // Extract headers from the first row
    const headers = data[0].map(h => h ? h.toString().trim() : '');
    console.log("Detected headers:", headers);

    // Remove header row
    data.shift();

    // Define permanent fields mapping
    const permanentFields = {
      "Sr. No": "serialNo",
      "First Name": "firstName",
      "Last Name": "lastName",
      "Company Name": "company",
      "Title": "title",
      "Email Address": "email",
      "Mobile Phone Number": "phone"
    };

    // Identify brand columns (non-permanent fields)
    const brandColumns = headers.filter(header => 
      header && !Object.keys(permanentFields).includes(header)
    );

    // Selection pattern for brands
    const selectionPattern = /(1ptr|1corp|1str)/i;

    // Process each row
    const processedData = data.map(row => {
      if (!row || row.length === 0) return null;

      const rowData = { event };

      // Process permanent fields
      Object.entries(permanentFields).forEach(([header, field]) => {
        const index = headers.indexOf(header);
        if (index >= 0 && row[index] !== undefined && row[index] !== null && row[index] !== '') {
          rowData[field] = row[index].toString().trim();
        }
      });

      // Skip if no email
      if (!rowData.email) return null;

      // Process brand selections
      rowData.selectedBy = brandColumns.map(brand => {
        const index = headers.indexOf(brand);
        let value = index >= 0 && row[index] ? row[index].toString().trim().toLowerCase() : '';
        console.log(`Brand: ${brand}, Value: "${value}", Selected: ${selectionPattern.test(value)}`);
        return {
          name: brand,
          selected: selectionPattern.test(value)
        };
      }).filter(brand => brand.name); // Remove empty brand names

      return rowData;
    }).filter(Boolean);

    console.log("Processed Data:", JSON.stringify(processedData, null, 2));

    if (processedData.length === 0) {
      return res.status(400).json({ error: "No valid data to process" });
    }

    // Get existing users
    const existingUsers = await UserCollection.find({ event });
    const emailMap = new Map(existingUsers.map(user => [user.email.toLowerCase(), user]));

    // Prepare bulk operations
    const bulkOps = processedData.map(newUser => {
      const emailKey = newUser.email.toLowerCase();
      const existingUser = emailMap.get(emailKey);

      if (existingUser) {
        // For existing users, merge the selectedBy arrays
        const updatedSelectedBy = [...(existingUser.selectedBy || [])];
        
        newUser.selectedBy.forEach(newBrand => {
          const existingBrandIndex = updatedSelectedBy.findIndex(
            b => b.name === newBrand.name
          );
          
          if (existingBrandIndex >= 0) {
            // Update existing brand selection
            updatedSelectedBy[existingBrandIndex].selected = newBrand.selected;
          } else {
            // Add new brand
            updatedSelectedBy.push(newBrand);
          }
        });

        return {
          updateOne: {
            filter: { _id: existingUser._id },
            update: {
              $set: {
                ...Object.fromEntries(
                  Object.entries(newUser)
                    .filter(([key]) => !['_id', 'email', 'selectedBy'].includes(key))
                    .map(([key, val]) => [key, val])
                ),
                selectedBy: updatedSelectedBy
              }
            }
          }
        };
      } else {
        // Insert new user with all brands
        return {
          insertOne: {
            document: {
              ...newUser,
              status: "pending",
              giftCollected: false
            }
          }
        };
      }
    });

    // Execute bulk write
    const result = await UserCollection.bulkWrite(bulkOps);
    console.log("Bulk write result:", result);

    return res.status(200).json({
      message: "File processed successfully",
      updated: result.modifiedCount,
      inserted: result.insertedCount,
      total: processedData.length
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getFileData = async (req, res) => {
  try {
    const { event } = req.params
     if(!event){
       return res.status(400).json({
      success: false,
      message: "Event id is required",
    });}
    const data = await UserCollection.find({event:event}).populate("event");
    return res.status(200).json({ users: data });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

export const deleteAllUsers = async (req, res) => {
  try {
    const { event } = req.params;
    
    // Validate event ID
    if (!event || typeof event !== 'string' || event.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Valid event ID is required",
      });
    }

    const eventId = event.trim();
    
    // Get count before deletion for verification
    const countBefore = await UserCollection.countDocuments({ event: eventId });
    
    if (countBefore === 0) {
      return res.status(200).json({
        success: true,
        message: `No users found for event ${eventId}`,
        deletedCount: 0
      });
    }

    // Use the safe method to delete users
    const result = await UserCollection.deleteMany({ event: eventId });
    
    // Verify the deletion
    const countAfter = await UserCollection.countDocuments({ event: eventId });
    
    if (countAfter > 0) {
      console.error(`Failed to delete all users for event ${eventId}. ${countAfter} records remain.`);
      return res.status(500).json({
        success: false,
        message: `Failed to delete all users. ${countAfter} records remain.`,
        deletedCount: countBefore - countAfter
      });
    }

    // If we get here, deletion was successful
    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${countBefore} users for event ${eventId}`,
      deletedCount: countBefore
    });
  } catch (error) {
    console.error("Error deleting all users:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

export const updateUserStatusByEmail = async (req, res) => {
  try {
    const { email, status } = req.body;
    const apiKey = req.headers['x-api-key'];

    // 1. Validate API Key
    if (!apiKey || apiKey !== process.env.X_API_KEY) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid API Key",
      });
    }

    // 2. Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!status || !["pending", "completed", "not-available", "removed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (pending, completed, not-available, removed)",
      });
    }

    // 3. Find and update the user by email
    const updatedUser = await UserCollection.findOneAndUpdate(
      { email: email },
      { $set: { status: status } },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with the provided email",
      });
    }

    // 4. Return success response
    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user: {
        email: updatedUser.email,
        status: updatedUser.status,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      },
    });

  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

// Update a user by ID
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Whitelist allowed fields to prevent mass assignment
    const { firstName, lastName, company, title, email, phone, status, comment, giftCollected } = req.body;
    const allowedUpdate = { firstName, lastName, company, title, email, phone, status, comment, giftCollected };
    // Remove undefined keys so we don't overwrite with undefined
    Object.keys(allowedUpdate).forEach(k => allowedUpdate[k] === undefined && delete allowedUpdate[k]);

    const updatedUser = await UserCollection.findByIdAndUpdate(id, allowedUpdate, { new: true });
    if (req.body?.giftCollected) {
      await UserCollection.updateOne({ _id: id }, { $set: { giftBy: req.userId } });
    }
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
  }
};

// Delete a user by ID
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await UserCollection.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
  }
};

// import { UserCollection } from "../model/filedata.model.js";

// export const deleteSlot = async (req, res) => {
//   try {
//     const userId = req.params.id;
//     console.log("user id is", userId);
//     const { slotTime } = req.body;
//     console.log(slotTime);

//     if (!userId || !slotTime) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const user = await UserCollection.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     console.log(user.slots);
//     console.log(user.slots.get(slotTime));

//     if (user.slots && user.slots.get(slotTime)) {
//       user.slots.delete(slotTime); // Use the delete method to remove the slot
//       await user.save();
//       return res.status(200).json({ message: "Slot deleted successfully" });
//     } else {
//       return res.status(404).json({ error: "Slot not found" });
//     }
//   } catch (error) {
//     console.error("Error deleting slot:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// export const getCompanyData = async (req, res) => {
//   try {
//     const companyName = req.params.companyName.toLowerCase();
//     // companyName.toLowerCase();
//     console.log("Searching for company:", companyName);

//     // Fetch all users who have the 'slots' field (ignore those without slots)
//     const users = await UserCollection.find({ slots: { $exists: true } });

//     // Filter users whose slots map contains the companyName
//     const filteredUsers = users.filter((user) =>
//       Array.from(user.slots.values()).includes(companyName)
//     );

//     console.log("Found users:", filteredUsers);

//     // Return the filtered users as a response
//     res.json(filteredUsers);
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ message: "Error fetching users" });
//   }
// };
