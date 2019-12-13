window.onload = function() {
  const pathname = window.location.pathname;
  if (Storydoc.mode === 'storyboard' && (pathname.length <= 11 || pathname.indexOf('/index.html', pathname.length-11) === -1)) {
    Storydoc.insertHTML(`
      <a href="../index.html">Home</a>&nbsp;&nbsp;
      <a href="#" onclick="javascript:window.history.back(-1);return false;">Back</a>
      <br>
    `, document.getElementsByTagName("body")[0]);
  }

  Storydoc.insertHTML(`
    <table border="1" cellpadding="3" cellspacing="0">
    <tr><th>Select</th><th>User ID</th><th>Status</th></tr>
    <tr><td><input type="checkbox"></td><td><u style="color:red;">user1</u></td><td>Activated</td></tr>
    <tr><td><input type="checkbox"></td><td><u style="color:red;">user2</u></td><td>Deactivated</td></tr>
    </table>
    <br>
    <button>Create</button>
    <button>Delete</button>
  `, '.userList');

  Storydoc.insertHTML(`
    <label>User ID</label> <input><br>
    <label>Password</label> <input><br>
    <label>Email</label> <input><br>
    ...<br>
    <button>Next</button>
  `, '.createForm');

  Storydoc.insertHTML(`
    <label>User ID</label> <input type="text" value="myuser1"><br>
    <label>Password</label> <input type="password" value="111111"><br>
    <label>Email</label> <input type="text" value="myemail@test.test"><br>
    ...<br>
  `, '.editForm');

  Storydoc.insertHTML(`
    <b>User ID</b> myuser1<br>
    <b>Password</b> (password is hidden)<br>
    <b>Email</b> myemail@test.test<br>
    ...<br>
  `, '.viewForm');
};
