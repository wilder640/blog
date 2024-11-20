document$.subscribe(function() {
    fetch('https://api.umami.is/v1/websites/53197f63-8bcf-4ee7-b1dc-3bb98354a997/stats?startAt=0&endAt=' + Date.now(), {
      headers: {
        'Content-Type': 'application/json',
        'x-umami-api-key': 'oGTvKvSH1fYV2wHXX3kEbkSEAHwnc6Tn'
      }
    })
    .then(response => response.json())
    .then(data => {
      document.getElementById('visits-count').textContent = data.visits.value;
    });
  });

  console.log(data.visits.value);