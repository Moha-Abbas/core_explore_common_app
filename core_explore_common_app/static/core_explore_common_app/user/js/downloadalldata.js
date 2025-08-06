document.addEventListener('DOMContentLoaded', function() {
  const query_id_el = document.getElementById("query_id");
  const query_id = query_id_el.textContent || query_id_el.innerText;
document.querySelector('#downloadalldata').addEventListener('click', function(event) {
   event.preventDefault();
   if (!query_id) {
       alert("Error in extraction, please reload the page.");
       return;
   }
   const table = document.getElementById('results');
   if (!table) {
       alert("No Data to download.");
       return;
   }
   const rows = document.getElementById('results_infos_0');
   if (!rows) {
       alert("No Data to download.");
       return;
   }
   const payload = { 
         query_id: query_id
     };
   showLoading();
   fetch('/download-all-data/', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
           'X-CSRFToken': csrftoken
       },
       body: JSON.stringify(payload),
   })
   .then(response => {
        if (!response.ok) {
            hideLoading();
            return response.text().then(text => Promise.reject(text || 'Error'));
        }
        return response.json();
    })
   .then(data => {
     if (!data.task_id) {
         hideLoading();
         throw new Error('No task_id returned');
     }
     function pollStatus() {
         fetch(`/download-status/?task_id=${encodeURIComponent(data.task_id)}`)
         .then(res => res.json())
         .then(status => {
             if (status.ready && status.download_url) {
                 hideLoading();
                 const link = document.createElement('a');
                 link.href = status.download_url;
                 link.download = '';
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
             } else if (status.state === 'FAILURE') {
                 hideLoading();
                 alert('File generation failed');
             } else {
                 setTimeout(pollStatus, 2000);
             }
         }).catch(err => {
             hideLoading();
             alert('Error fetching download status');
             console.error(err);
         });
       }
      pollStatus();
    })
    .catch(err => {
        hideLoading();
        alert('Download failed: ' + err);
        console.error(err);
    });
  });
});
