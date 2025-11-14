# Cancer-Risk-Stratification

## StakeHolders
1. Doctors
2. Radiologists
3. Admin Team

## Control Flows:
### Radiologists:
1. They go to the website.com, and click on radiologists button and they are taken to /radiologist endpoint.
2. There they upload the report files and after processing we show the entry of the patient with all the details that will be put into database.
3. The Radiologists edits the patient profile if needed and then confirms and then she is added into the database along with the report (This is viable if the person in question is present here to confirm the profile details)
#### Backend:
1. We take the profile details and enter it in our database, and do post-processing on the pdf that is Vision(link), then LLM Report generation(link) and then DB Entry(link) they are explained in the following, click on the links to go to the particular topics. There can be two following further flows:
	1. Then we send Confirmation, of profile added if the person doesn't exist in the database.
	2. Person already exists: We ask if it the same person and ask if we want to submit the updated report and ask for confirmation.
### Doctors:
1. They go to the website.com, and click on doctors button and they are taken to /doctors endpoint.
2. They login with their details and then they have a uniuqe doctor identifier.
3. They Get all the reports in decending order of severity of all the patients with basically in form of a table with 4 entries - Nmae, Score, Our Report, In progress or not, and final check box if its reviewed or not.
4. They click on the name for further reports, see and verify them and then click the chheckbox for verification complete or not.
5. There are couple of problems with Concurrency(link) that will be discusses below.




We need to :
4. make some documentation
