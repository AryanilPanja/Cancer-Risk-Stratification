export const uploadReports = (req,res)=>{  //using const to export and not a function keep it so in whole codebase to be consistent
    res.status(201).json({"message": "Report uploaded and processing started.", "reportId": "..." });
};