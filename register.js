function showForm(type) {
    document.getElementById("clientForm").classList.add("hidden");
    document.getElementById("ownerForm").classList.add("hidden");
  
    if (type === "client") {
      document.getElementById("clientForm").classList.remove("hidden");
    } else if (type === "owner") {
      document.getElementById("ownerForm").classList.remove("hidden");
    }
  }
  