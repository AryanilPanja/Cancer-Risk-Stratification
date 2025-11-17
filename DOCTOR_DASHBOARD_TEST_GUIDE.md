# Doctor Dashboard - Quick Test Guide

## 🚀 Quick Start

### 1. Start the Servers

```bash
# Terminal 1 - Backend
cd code/backend
npm run dev

# Terminal 2 - Frontend
cd code/frontend
npm start
```

### 2. Login as Doctor

```
URL: http://localhost:3000/login
Email: doctor@example.com
Password: [your doctor password]
```

### 3. Access Dashboard

After login, you'll be redirected to: `http://localhost:3000/doctor-dashboard`

---

## ✅ Features to Test

### Test 1: View Table
- [ ] Table shows patients sorted by cancer score (highest first)
- [ ] Risk levels color-coded (Red=High, Orange=Medium, Green=Low)
- [ ] Progress bars show cancer scores visually
- [ ] All patient details visible in table

### Test 2: Search Functionality
- [ ] Type patient name in search box
- [ ] Table filters in real-time
- [ ] Search also works with Patient ID
- [ ] Clear search shows all results

### Test 3: Risk Filter
- [ ] Select "High Risk" - shows only high-risk patients
- [ ] Select "Medium Risk" - shows only medium-risk patients
- [ ] Select "Low Risk" - shows only low-risk patients
- [ ] Select "All Risks" - shows all patients

### Test 4: Statistics Summary
- [ ] Total count updates with search/filter
- [ ] High/Medium/Low counts accurate
- [ ] Badges color-coded correctly

### Test 5: Patient Details Modal
- [ ] Click "👁️ View" button on any patient
- [ ] Modal opens with complete information
- [ ] Patient section shows: ID, Name, DOB, Age, Gender, Phone
- [ ] File section shows: Filename, Upload Date, Location
- [ ] Analysis section shows:
  - [ ] Risk Level badge (color-coded)
  - [ ] Cancer Positive Score (0-100%)
  - [ ] Progress bar visualization
  - [ ] Full Diagnosis Analysis text
- [ ] Verification section shows status
- [ ] Close button works

### Test 6: PDF Viewer
**From Table:**
- [ ] Click "📄 PDF" button
- [ ] PDF modal opens full-screen
- [ ] PDF displays correctly
- [ ] Close button works

**From Detail Modal:**
- [ ] Click "View Full PDF Report" in modal footer
- [ ] PDF opens in separate modal
- [ ] Both modals can be closed independently

### Test 7: Doctor Verification
**For Unverified Report:**
- [ ] Click "✓ Verify" button
- [ ] Prompted for comments
- [ ] Prompted for score (0-100)
- [ ] Enter both values and submit
- [ ] Success message appears
- [ ] Table refreshes automatically
- [ ] Report now shows "✅ Verified"
- [ ] Verify button disappears

**For Verified Report:**
- [ ] No verify button shown
- [ ] Status shows "✅ Verified"
- [ ] Click "View" to see verification details
- [ ] Modal shows doctor comments and score

### Test 8: Refresh Functionality
- [ ] Click "🔄 Refresh" button
- [ ] Loading state appears briefly
- [ ] Table reloads with latest data
- [ ] All filters/search remain active

### Test 9: Responsive Design
**Desktop (> 1200px):**
- [ ] Full table visible
- [ ] All columns displayed
- [ ] Modals centered

**Tablet (768px - 1199px):**
- [ ] Table scrolls horizontally if needed
- [ ] Controls stack vertically
- [ ] Modals resize appropriately

**Mobile (< 768px):**
- [ ] Table scrolls horizontally
- [ ] Search/filter stack vertically
- [ ] Modal takes full width
- [ ] Buttons responsive

### Test 10: Error Handling
**Network Error:**
- [ ] Stop backend server
- [ ] Click refresh
- [ ] Error message displays
- [ ] No crash, graceful degradation

**Missing PDF:**
- [ ] Report with no PDF file
- [ ] Click PDF button
- [ ] Alert shows "PDF not available"
- [ ] No console errors

---

## 🎯 Expected Behavior

### Table Sorting:
```
Row 1: Patient with 95% cancer score (HIGH)
Row 2: Patient with 87% cancer score (HIGH)
Row 3: Patient with 65% cancer score (MEDIUM)
Row 4: Patient with 45% cancer score (MEDIUM)
Row 5: Patient with 22% cancer score (LOW)
```

### Risk Level Colors:
- **HIGH**: Red badge (#e74c3c)
- **MEDIUM**: Orange badge (#f39c12)
- **LOW**: Green badge (#27ae60)
- **UNKNOWN**: Gray badge (#95a5a6)

### Status Indicators:
- **Verified**: Green background, "✅ Verified"
- **Pending**: Yellow background, "⏳ Pending"

---

## 🐛 Common Issues & Solutions

### Issue: Table is empty
**Solution:**
1. Check if backend is running
2. Check MongoDB connection
3. Verify reports exist in database
4. Check browser console for errors

### Issue: PDF not displaying
**Solution:**
1. Verify file exists in `backend/uploads/`
2. Check file path in database
3. Ensure static file serving enabled
4. Try opening PDF URL directly

### Issue: Search not working
**Solution:**
1. Clear search box and try again
2. Check if patient name/ID exists
3. Disable any browser extensions
4. Refresh the page

### Issue: Verification fails
**Solution:**
1. Check JWT token is valid
2. Ensure doctor role permissions
3. Verify backend endpoint works
4. Check network tab for errors

---

## 📊 Sample Test Data

If you need to add test data, run this in MongoDB:

```javascript
// Patient
db.patients.insertOne({
  patientId: "PAT_TEST001",
  name: "John Test",
  dateOfBirth: new Date("1975-06-15"),
  gender: "Male",
  phoneNumber: "+1234567890"
});

// Report
db.reports.insertOne({
  patient: <patient_id>,
  originalFileName: "test_report.pdf",
  fileLocation: "/uploads/test_report.pdf",
  riskLevel: "high",
  cancerPositiveScore: 85,
  diagnosisAnalysis: "The pathology report indicates suspicious cells...",
  status: "Pending",
  doctorVerification: {
    isVerified: false
  }
});
```

---

## ✨ Visual Checklist

### When Dashboard Loads:
- [ ] Purple gradient header visible
- [ ] "Doctor Dashboard" title clear
- [ ] Refresh button in top-right
- [ ] Search box and filters below header
- [ ] Statistics summary showing counts
- [ ] Table with all columns
- [ ] Data sorted by risk (highest first)
- [ ] Color-coded badges
- [ ] Progress bars animating
- [ ] Action buttons on each row

### When Modal Opens:
- [ ] Smooth animation (slide up)
- [ ] Purple gradient header
- [ ] Close button (X) top-right
- [ ] Four sections clearly separated:
  1. Patient Information (blue border)
  2. File Information (blue border)
  3. Cancer Risk Analysis (purple border)
  4. Doctor Verification (blue border)
- [ ] Footer with buttons

### When PDF Opens:
- [ ] Dark overlay behind modal
- [ ] PDF modal centered
- [ ] Purple header with title
- [ ] Close button visible
- [ ] PDF renders inside iframe
- [ ] Scrollable if needed

---

## 🎬 Testing Workflow

### Complete Test Cycle:

1. **Login** → Redirected to dashboard
2. **View Table** → Sorted by risk score
3. **Search** → Type "John" → Results filter
4. **Filter** → Select "High Risk" → Only high shown
5. **View Details** → Click view on first patient
6. **Check Data** → All fields populated
7. **View PDF** → PDF opens and displays
8. **Close PDF** → Returns to detail modal
9. **Close Modal** → Returns to table
10. **Verify Report** → Enter comments and score
11. **Confirm** → Report marked verified
12. **Refresh** → Data reloads

**Total Time:** ~5 minutes

---

## 📱 Browser Compatibility

Test in these browsers:
- [ ] Chrome (recommended)
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 🎯 Performance Metrics

Expected performance:
- **Initial Load**: < 2 seconds
- **Search/Filter**: Instant (< 100ms)
- **Modal Open**: < 300ms
- **PDF Load**: 1-3 seconds (depending on size)
- **Verification**: < 1 second

---

## ✅ Success Criteria

Dashboard is working if:
- ✅ All reports load and display
- ✅ Sorting by risk score works
- ✅ Search filters instantly
- ✅ Risk filter updates table
- ✅ Patient details show all data
- ✅ PDF viewer displays documents
- ✅ Verification updates database
- ✅ No console errors
- ✅ Responsive on all devices
- ✅ Smooth animations

---

## 🎉 You're Done!

If all tests pass, the Doctor Dashboard is fully functional and ready for production use!

**Next Steps:**
1. Show to stakeholders
2. Gather feedback
3. Deploy to production
4. Monitor usage

---

**Need help?** Check the detailed guides:
- `DOCTOR_DASHBOARD_GUIDE.md` - Complete documentation
- `DOCTOR_DASHBOARD_SUMMARY.md` - Implementation details
