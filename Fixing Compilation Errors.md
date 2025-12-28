# Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

### User Input

2025-12-28 19:57:13.507 [info] [main] Log level: Info
2025-12-28 19:57:13.507 [info] [main] Validating found git in: "/usr/bin/git"
2025-12-28 19:57:13.578 [info] [main] Using git "2.50.1 (Apple Git-155)" from "/usr/bin/git"
2025-12-28 19:57:13.578 [info] [Model][doInitialScan] Initial repository scan started
2025-12-28 19:57:13.831 [info] > git rev-parse --show-toplevel [242ms]
2025-12-28 19:57:13.864 [info] > git rev-parse --git-dir --git-common-dir --show-superproject-working-tree [30ms]
2025-12-28 19:57:13.870 [info] [Model][openRepository] Opened repository (path): /Users/faucqueurstacy/Documents/GitHub/app
2025-12-28 19:57:13.870 [info] [Model][openRepository] Opened repository (real path): /Users/faucqueurstacy/Documents/GitHub/app
2025-12-28 19:57:13.870 [info] [Model][openRepository] Opened repository (kind): repository
2025-12-28 19:57:13.899 [info] > git rev-parse --show-toplevel [26ms]
2025-12-28 19:57:13.901 [info] > git config --get commit.template [28ms]
2025-12-28 19:57:13.904 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [29ms]
2025-12-28 19:57:13.920 [info] > git rev-parse --show-toplevel [20ms]
2025-12-28 19:57:13.929 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 19:57:13.950 [info] > git rev-parse --show-toplevel [29ms]
2025-12-28 19:57:14.019 [info] > git rev-parse --show-toplevel [67ms]
2025-12-28 19:57:14.058 [info] > git rev-parse --show-toplevel [37ms]
2025-12-28 19:57:14.082 [info] > git rev-parse --show-toplevel [22ms]
2025-12-28 19:57:14.084 [info] [Model][doInitialScan] Initial repository scan completed - repositories (1), closed repositories (0), parent repositories (0), unsafe repositories (0)
2025-12-28 19:57:14.397 [info] > git check-ignore -v -z --stdin [16ms]
2025-12-28 19:58:44.480 [info] > git check-ignore -v -z --stdin [58888ms]
2025-12-28 19:58:44.910 [info] > git push -u origin main [36094ms]
2025-12-28 19:58:44.910 [info] Everything up-to-date
2025-12-28 19:58:44.921 [info] > git status -z -uall [91015ms] (cancelled)
2025-12-28 19:58:44.964 [info] > git config --get commit.template [44ms]
2025-12-28 19:58:44.964 [info] > git config --get commit.template [43ms]
2025-12-28 19:59:02.773 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17855ms]
2025-12-28 19:59:02.791 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17867ms]
2025-12-28 19:59:02.791 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17867ms]
2025-12-28 19:59:02.799 [info] > git config --get --local branch.main.vscode-merge-base [22ms]
2025-12-28 19:59:02.817 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 19:59:02.821 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/origin/main refs/remotes/origin/main [20ms]
2025-12-28 19:59:02.846 [info] > git merge-base refs/heads/main refs/remotes/origin/main [22ms]
2025-12-28 19:59:02.847 [info] > git merge-base refs/heads/main refs/remotes/origin/main [24ms]
2025-12-28 19:59:09.092 [info] > git diff --name-status -z --diff-filter=ADMR 2caf5e881c6fd6109493474331147604e935059b...refs/remotes/origin/main [6245ms]
2025-12-28 19:59:09.099 [info] > git diff --name-status -z --diff-filter=ADMR 2caf5e881c6fd6109493474331147604e935059b...refs/remotes/origin/main [6252ms]
2025-12-28 19:59:28.917 [info] > git fetch [135047ms]
2025-12-28 19:59:28.919 [info] > git status -z -uall [26126ms] (cancelled)
2025-12-28 19:59:28.936 [info] > git config --get commit.template [17ms]
2025-12-28 19:59:28.937 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 19:59:28.955 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 20:01:46.490 [info] > git status -z -uall [137551ms]
2025-12-28 20:02:04.230 [info] > git config --get commit.template [39ms]
2025-12-28 20:02:04.234 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [41ms]
2025-12-28 20:02:04.257 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 20:02:04.272 [info] > git status -z -uall [37ms]
2025-12-28 20:02:19.745 [info] > git config --get commit.template [36ms]
2025-12-28 20:02:19.748 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [37ms]
2025-12-28 20:02:19.772 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 20:02:19.789 [info] > git status -z -uall [40ms]
2025-12-28 20:02:42.182 [info] > git config --get commit.template [33ms]
2025-12-28 20:02:42.186 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 20:02:42.210 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 20:02:42.229 [info] > git status -z -uall [42ms]
2025-12-28 20:03:04.624 [info] > git config --get commit.template [22ms]
2025-12-28 20:03:04.626 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [21ms]
2025-12-28 20:03:04.642 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [15ms]
2025-12-28 20:03:04.661 [info] > git status -z -uall [35ms]
2025-12-28 20:03:14.466 [info] > git config --get commit.template [32ms]
2025-12-28 20:03:14.468 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 20:03:14.491 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 20:03:14.520 [info] > git status -z -uall [51ms]
2025-12-28 20:03:57.041 [info] > git config --get commit.template [30ms]
2025-12-28 20:03:57.044 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [30ms]
2025-12-28 20:03:57.062 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 20:03:57.082 [info] > git status -z -uall [37ms]
2025-12-28 20:04:02.115 [info] > git config --get commit.template [22ms]
2025-12-28 20:04:02.117 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [21ms]
2025-12-28 20:04:02.135 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 20:04:02.141 [info] > git status -z -uall [24ms]
2025-12-28 20:04:23.741 [info] > git config --get commit.template [29ms]
2025-12-28 20:04:23.743 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [30ms]
2025-12-28 20:04:23.763 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 20:04:23.783 [info] > git status -z -uall [39ms]
2025-12-28 20:04:43.263 [info] > git config --get commit.template [46ms]
2025-12-28 20:05:00.911 [info] > git ls-files --stage -- app/(auth)/register.tsx [20ms]
2025-12-28 20:05:00.929 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [17ms]
2025-12-28 20:05:03.635 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [20413ms]
2025-12-28 20:05:03.806 [info] > git show --textconv :app/(auth)/register.tsx [2916ms]
2025-12-28 20:05:05.608 [info] > git check-ignore -v -z --stdin [4201ms]
2025-12-28 20:05:05.893 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [35ms]
2025-12-28 20:05:12.771 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [41ms]
2025-12-28 20:05:12.772 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:12.792 [info] > git config --get-all user.name [19ms]
2025-12-28 20:05:12.815 [info] > git config --get-all user.email [22ms]
2025-12-28 20:05:12.889 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [18ms]
2025-12-28 20:05:12.889 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:12.904 [info] > git config --get-all user.name [14ms]
2025-12-28 20:05:12.919 [info] > git config --get-all user.email [14ms]
2025-12-28 20:05:13.136 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:05:13.136 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:13.150 [info] > git config --get-all user.name [14ms]
2025-12-28 20:05:13.165 [info] > git config --get-all user.email [14ms]
2025-12-28 20:05:13.635 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [17ms]
2025-12-28 20:05:13.635 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:13.651 [info] > git config --get-all user.name [15ms]
2025-12-28 20:05:13.666 [info] > git config --get-all user.email [15ms]
2025-12-28 20:05:14.503 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [31ms]
2025-12-28 20:05:14.503 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:14.526 [info] > git config --get-all user.name [22ms]
2025-12-28 20:05:14.546 [info] > git config --get-all user.email [19ms]
2025-12-28 20:05:15.826 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [24ms]
2025-12-28 20:05:15.826 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:15.846 [info] > git config --get-all user.name [19ms]
2025-12-28 20:05:15.866 [info] > git config --get-all user.email [19ms]
2025-12-28 20:05:17.710 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [36ms]
2025-12-28 20:05:17.711 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:17.729 [info] > git config --get-all user.name [17ms]
2025-12-28 20:05:17.748 [info] > git config --get-all user.email [18ms]
2025-12-28 20:05:20.239 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [34ms]
2025-12-28 20:05:20.239 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:20.261 [info] > git config --get-all user.name [21ms]
2025-12-28 20:05:20.278 [info] > git config --get-all user.email [17ms]
2025-12-28 20:05:23.525 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [41ms]
2025-12-28 20:05:23.525 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:23.546 [info] > git config --get-all user.name [20ms]
2025-12-28 20:05:23.563 [info] > git config --get-all user.email [16ms]
2025-12-28 20:05:26.947 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [26057ms]
2025-12-28 20:05:26.953 [info] > git show --textconv HEAD:app/(auth)/register.tsx [26064ms]
2025-12-28 20:05:27.014 [info] > git check-ignore -v -z --stdin [22ms]
2025-12-28 20:05:27.038 [info] > git check-ignore -v -z --stdin [19ms]
2025-12-28 20:05:27.633 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [19ms]
2025-12-28 20:05:27.633 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:27.648 [info] > git config --get-all user.name [14ms]
2025-12-28 20:05:27.662 [info] > git config --get-all user.email [13ms]
2025-12-28 20:05:32.705 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [35ms]
2025-12-28 20:05:32.705 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:32.726 [info] > git config --get-all user.name [20ms]
2025-12-28 20:05:32.743 [info] > git config --get-all user.email [17ms]
2025-12-28 20:05:32.744 [info] > git status -z -uall [26887ms] (cancelled)
2025-12-28 20:05:32.759 [info] > git config --get commit.template [15ms]
2025-12-28 20:05:32.760 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [15ms]
2025-12-28 20:05:32.777 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 20:08:19.201 [info] > git blame --root --incremental 2caf5e881c6fd6109493474331147604e935059b -- app/(auth)/register.tsx [172088ms]
2025-12-28 20:08:34.769 [info] > git status -z -uall [182008ms]
2025-12-28 20:08:36.110 [info] > git ls-files --stage -- app/(auth)/register.tsx [17ms]
2025-12-28 20:08:36.111 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [19ms]
2025-12-28 20:08:36.127 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [17ms]
2025-12-28 20:08:36.127 [info] > git show --textconv HEAD:app/(auth)/register.tsx [15ms]
2025-12-28 20:08:36.144 [info] > git show --textconv :app/(auth)/register.tsx [16ms]
2025-12-28 20:08:39.711 [info] > git fetch [4936ms]
2025-12-28 20:08:39.728 [info] > git config --get commit.template [17ms]
2025-12-28 20:08:39.728 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [16ms]
2025-12-28 20:08:39.747 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 20:08:40.924 [info] > git ls-files --stage -- app/(auth)/register.tsx [28ms]
2025-12-28 20:08:40.926 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [31ms]
2025-12-28 20:08:40.948 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [23ms]
2025-12-28 20:08:40.952 [info] > git show --textconv HEAD:app/(auth)/register.tsx [22ms]
2025-12-28 20:08:40.969 [info] > git show --textconv :app/(auth)/register.tsx [19ms]
2025-12-28 20:08:41.378 [info] > git show -s --decorate=full --shortstat --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z 2caf5e881c6fd6109493474331147604e935059b -- [6604ms]
2025-12-28 20:09:02.113 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [45ms]
2025-12-28 20:09:02.113 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:02.132 [info] > git config --get-all user.name [19ms]
2025-12-28 20:09:02.152 [info] > git config --get-all user.email [19ms]
2025-12-28 20:09:02.223 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [17ms]
2025-12-28 20:09:02.223 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:02.239 [info] > git config --get-all user.name [16ms]
2025-12-28 20:09:02.254 [info] > git config --get-all user.email [14ms]
2025-12-28 20:09:02.478 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [18ms]
2025-12-28 20:09:02.478 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:02.496 [info] > git config --get-all user.name [17ms]
2025-12-28 20:09:02.512 [info] > git config --get-all user.email [16ms]
2025-12-28 20:09:02.993 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [30ms]
2025-12-28 20:09:02.993 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:03.016 [info] > git config --get-all user.name [22ms]
2025-12-28 20:09:03.034 [info] > git config --get-all user.email [18ms]
2025-12-28 20:09:03.855 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [14ms]
2025-12-28 20:09:03.856 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:03.870 [info] > git config --get-all user.name [14ms]
2025-12-28 20:09:03.885 [info] > git config --get-all user.email [15ms]
2025-12-28 20:09:05.170 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [32ms]
2025-12-28 20:09:05.170 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:05.192 [info] > git config --get-all user.name [21ms]
2025-12-28 20:09:05.210 [info] > git config --get-all user.email [17ms]
2025-12-28 20:09:07.038 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [25ms]
2025-12-28 20:09:07.038 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:07.062 [info] > git config --get-all user.name [23ms]
2025-12-28 20:09:07.082 [info] > git config --get-all user.email [19ms]
2025-12-28 20:09:09.575 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [35ms]
2025-12-28 20:09:09.575 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:09.598 [info] > git config --get-all user.name [22ms]
2025-12-28 20:09:09.617 [info] > git config --get-all user.email [18ms]
2025-12-28 20:09:12.838 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:09:12.838 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:12.858 [info] > git config --get-all user.name [20ms]
2025-12-28 20:09:12.875 [info] > git config --get-all user.email [16ms]
2025-12-28 20:09:13.365 [info] > git check-ignore -v -z --stdin [27ms]
2025-12-28 20:09:16.965 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [33ms]
2025-12-28 20:09:16.965 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:16.986 [info] > git config --get-all user.name [20ms]
2025-12-28 20:09:17.005 [info] > git config --get-all user.email [18ms]
2025-12-28 20:09:22.040 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [33ms]
2025-12-28 20:09:22.040 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:22.063 [info] > git config --get-all user.name [22ms]
2025-12-28 20:09:22.081 [info] > git config --get-all user.email [18ms]
2025-12-28 20:09:22.082 [info] > git status -z -uall [42353ms] (cancelled)
2025-12-28 20:09:22.098 [info] > git config --get commit.template [16ms]
2025-12-28 20:09:22.100 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 20:09:22.118 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 20:09:22.534 [info] > git status -z -uall [433ms]
2025-12-28 20:09:22.579 [info] > git show -s --decorate=full --shortstat --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z 2caf5e881c6fd6109493474331147604e935059b -- [41ms]
2025-12-28 20:09:29.616 [info] > git log --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z --shortstat --diff-merges=first-parent -n50 --skip=0 --topo-order --decorate=full --stdin [626791ms]
2025-12-28 20:09:36.506 [info] > git config --get commit.template [43ms]
2025-12-28 20:09:36.514 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [51ms]
2025-12-28 20:09:36.573 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [58ms]
2025-12-28 20:09:46.249 [info] > git check-ignore -v -z --stdin [37ms]
2025-12-28 20:10:11.694 [info] > git ls-files --stage -- app/(auth)/register.tsx [26ms]
2025-12-28 20:10:11.697 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [30ms]
2025-12-28 20:10:11.716 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [21ms]
2025-12-28 20:10:11.719 [info] > git show --textconv HEAD:app/(auth)/register.tsx [21ms]
2025-12-28 20:10:11.737 [info] > git show --textconv :app/(auth)/register.tsx [20ms]
2025-12-28 20:10:12.078 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:10:12.078 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:12.096 [info] > git config --get-all user.name [17ms]
2025-12-28 20:10:12.118 [info] > git config --get-all user.email [21ms]
2025-12-28 20:10:12.192 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [19ms]
2025-12-28 20:10:12.192 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:12.210 [info] > git config --get-all user.name [17ms]
2025-12-28 20:10:12.226 [info] > git config --get-all user.email [16ms]
2025-12-28 20:10:12.450 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [20ms]
2025-12-28 20:10:12.450 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:12.469 [info] > git config --get-all user.name [18ms]
2025-12-28 20:10:12.485 [info] > git config --get-all user.email [16ms]
2025-12-28 20:10:12.956 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:10:12.956 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:12.972 [info] > git config --get-all user.name [15ms]
2025-12-28 20:10:12.987 [info] > git config --get-all user.email [15ms]
2025-12-28 20:10:13.809 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:10:13.809 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:13.826 [info] > git config --get-all user.name [16ms]
2025-12-28 20:10:13.843 [info] > git config --get-all user.email [17ms]
2025-12-28 20:10:13.936 [info] > git status -z -uall [37421ms]
2025-12-28 20:10:15.114 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [17ms]
2025-12-28 20:10:15.114 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:15.160 [info] > git config --get-all user.name [45ms]
2025-12-28 20:10:15.210 [info] > git config --get-all user.email [49ms]
2025-12-28 20:10:17.043 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [31ms]
2025-12-28 20:10:17.043 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:17.065 [info] > git config --get-all user.name [21ms]
2025-12-28 20:10:17.083 [info] > git config --get-all user.email [18ms]
2025-12-28 20:10:19.562 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [22ms]
2025-12-28 20:10:19.562 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:19.579 [info] > git config --get-all user.name [17ms]
2025-12-28 20:10:19.597 [info] > git config --get-all user.email [17ms]
2025-12-28 20:10:22.834 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [31ms]
2025-12-28 20:10:22.834 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:22.857 [info] > git config --get-all user.name [22ms]
2025-12-28 20:10:22.875 [info] > git config --get-all user.email [18ms]
2025-12-28 20:10:26.958 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [26ms]
2025-12-28 20:10:26.958 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:26.976 [info] > git config --get-all user.name [18ms]
2025-12-28 20:10:26.995 [info] > git config --get-all user.email [18ms]
2025-12-28 20:10:32.014 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [17ms]
2025-12-28 20:10:32.014 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:32.031 [info] > git config --get-all user.name [16ms]
2025-12-28 20:10:32.048 [info] > git config --get-all user.email [16ms]
2025-12-28 20:10:32.067 [info] > git config --get commit.template [17ms]
2025-12-28 20:10:32.069 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [19ms]
2025-12-28 20:10:32.090 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 20:10:32.111 [info] > git status -z -uall [41ms]
2025-12-28 20:10:32.135 [info] > git show -s --decorate=full --shortstat --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z 2caf5e881c6fd6109493474331147604e935059b -- [22ms]
2025-12-28 20:10:56.031 [info] > git config --get commit.template [23ms]
2025-12-28 20:10:56.034 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [25ms]
2025-12-28 20:10:56.141 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [104ms]
2025-12-28 20:10:56.162 [info] > git status -z -uall [125ms]
2025-12-28 20:10:58.039 [info] > git ls-files --stage -- app/(auth)/register.tsx [34ms]
2025-12-28 20:10:58.041 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [38ms]
2025-12-28 20:10:58.064 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [24ms]
2025-12-28 20:10:58.070 [info] > git show --textconv HEAD:app/(auth)/register.tsx [26ms]
2025-12-28 20:10:58.086 [info] > git show --textconv :app/(auth)/register.tsx [20ms]
2025-12-28 20:11:01.196 [info] > git config --get commit.template [22ms]
2025-12-28 20:11:01.197 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [22ms]
2025-12-28 20:11:01.227 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [28ms]
2025-12-28 20:11:01.235 [info] > git status -z -uall [36ms]
2025-12-28 20:11:09.005 [info] > git config --get commit.template [25ms]
2025-12-28 20:11:09.008 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [28ms]
2025-12-28 20:11:09.029 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [20ms]
2025-12-28 20:11:09.041 [info] > git status -z -uall [33ms]
2025-12-28 20:11:31.152 [info] > git config --get commit.template [31ms]
2025-12-28 20:11:31.157 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [35ms]
2025-12-28 20:11:31.186 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [27ms]
2025-12-28 20:11:31.242 [info] > git status -z -uall [84ms]


*User accepted the command `rm -f /Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock`*

*Searched filesystem*

*User accepted the command `git status`*

*Viewed [schema.sql](file:///Users/faucqueurstacy/Documents/GitHub/app/schema.sql) *

*Viewed [index.ts](file:///Users/faucqueurstacy/Documents/GitHub/app/src/types/index.ts) *

### Planner Response

I've removed the `.git/index.lock` file that was preventing you from committing changes.

The repository status shows several modified and untracked files, including:
-   [schema.sql](cci:7://file:///Users/faucqueurstacy/Documents/GitHub/app/schema.sql:0:0-0:0) (New tables for features like Fronting History, Help Requests, Emotions, etc.)
-   [src/types/index.ts](cci:7://file:///Users/faucqueurstacy/Documents/GitHub/app/src/types/index.ts:0:0-0:0) (Updated interfaces matching the schema)
-   [app/alter-space/[alterId]/edit.tsx](cci:7://file:///Users/faucqueurstacy/Documents/GitHub/app/app/alter-space/%5BalterId%5D/edit.tsx:0:0-0:0) (New file)
-   Changes to [app/home.tsx](cci:7://file:///Users/faucqueurstacy/Documents/GitHub/app/app/home.tsx:0:0-0:0), [src/components/AlterBubble.tsx](cci:7://file:///Users/faucqueurstacy/Documents/GitHub/app/src/components/AlterBubble.tsx:0:0-0:0), and others.

It looks like you were in the middle of implementing core features (Profiles, Roles, Fronting). Would you like me to:
1.  **Commit these changes** for you now?
2.  **Continue with the implementation** (I can create a `task.md` and verify the work)?
3.  **Debug** a specific issue?

Let me know how you'd like to proceed!

### User Input

je doit faire quoi maintenant

*Edited relevant file*

*Edited relevant file*

*User accepted the command `npx tsc --noEmit`*

*Checked command status*

*User accepted the command `diff app/\(auth\)/register.tsx app/\(auth\)/register.tsx`*

*User accepted the command `git diff app/\(auth\)/register.tsx`*

*Edited relevant file*

*Checked command status*

*User accepted the command `git diff --cached app/\(auth\)/register.tsx app/\(auth\)/login.tsx`*

*Edited relevant file*

*User accepted the command `npx tsc --noEmit`*

*User accepted the command `git diff --cached "app/(auth)/register.tsx"`*

*Checked command status*

*User accepted the command `git diff --cached --name-only`*

*Checked command status*

*Viewed [index.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/app/alter-space/%5BalterId%5D/index.tsx) *

*Viewed [AlterBubble.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/src/components/AlterBubble.tsx) *

*Viewed [alters.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/app/%28tabs%29/alters.tsx) *

*Listed directory [lib](file:///Users/faucqueurstacy/Documents/GitHub/app/src/lib) *

*Viewed [AuthContext.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/src/contexts/AuthContext.tsx) *

*Edited relevant file*

*User accepted the command `mv src/lib/"supabase 2.ts" src/lib/supabase.ts && mv src/lib/"theme 2.ts" src/lib/theme.ts`*

*Edited relevant file*

*Viewed [AuthContext.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/src/contexts/AuthContext.tsx) *

*Edited relevant file*

*User accepted the command `npx tsc --noEmit`*

*Checked command status*

*Checked command status*

*Viewed [login.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/app/%28auth%29/login.tsx) *

*Viewed [home.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/app/home.tsx) *

*Viewed [index.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/app/alter-space/%5BalterId%5D/index.tsx) *

*Checked command status*

### User Input

2025-12-28 19:57:13.507 [info] [main] Log level: Info
2025-12-28 19:57:13.507 [info] [main] Validating found git in: "/usr/bin/git"
2025-12-28 19:57:13.578 [info] [main] Using git "2.50.1 (Apple Git-155)" from "/usr/bin/git"
2025-12-28 19:57:13.578 [info] [Model][doInitialScan] Initial repository scan started
2025-12-28 19:57:13.831 [info] > git rev-parse --show-toplevel [242ms]
2025-12-28 19:57:13.864 [info] > git rev-parse --git-dir --git-common-dir --show-superproject-working-tree [30ms]
2025-12-28 19:57:13.870 [info] [Model][openRepository] Opened repository (path): /Users/faucqueurstacy/Documents/GitHub/app
2025-12-28 19:57:13.870 [info] [Model][openRepository] Opened repository (real path): /Users/faucqueurstacy/Documents/GitHub/app
2025-12-28 19:57:13.870 [info] [Model][openRepository] Opened repository (kind): repository
2025-12-28 19:57:13.899 [info] > git rev-parse --show-toplevel [26ms]
2025-12-28 19:57:13.901 [info] > git config --get commit.template [28ms]
2025-12-28 19:57:13.904 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [29ms]
2025-12-28 19:57:13.920 [info] > git rev-parse --show-toplevel [20ms]
2025-12-28 19:57:13.929 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 19:57:13.950 [info] > git rev-parse --show-toplevel [29ms]
2025-12-28 19:57:14.019 [info] > git rev-parse --show-toplevel [67ms]
2025-12-28 19:57:14.058 [info] > git rev-parse --show-toplevel [37ms]
2025-12-28 19:57:14.082 [info] > git rev-parse --show-toplevel [22ms]
2025-12-28 19:57:14.084 [info] [Model][doInitialScan] Initial repository scan completed - repositories (1), closed repositories (0), parent repositories (0), unsafe repositories (0)
2025-12-28 19:57:14.397 [info] > git check-ignore -v -z --stdin [16ms]
2025-12-28 19:58:44.480 [info] > git check-ignore -v -z --stdin [58888ms]
2025-12-28 19:58:44.910 [info] > git push -u origin main [36094ms]
2025-12-28 19:58:44.910 [info] Everything up-to-date
2025-12-28 19:58:44.921 [info] > git status -z -uall [91015ms] (cancelled)
2025-12-28 19:58:44.964 [info] > git config --get commit.template [44ms]
2025-12-28 19:58:44.964 [info] > git config --get commit.template [43ms]
2025-12-28 19:59:02.773 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17855ms]
2025-12-28 19:59:02.791 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17867ms]
2025-12-28 19:59:02.791 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17867ms]
2025-12-28 19:59:02.799 [info] > git config --get --local branch.main.vscode-merge-base [22ms]
2025-12-28 19:59:02.817 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 19:59:02.821 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/origin/main refs/remotes/origin/main [20ms]
2025-12-28 19:59:02.846 [info] > git merge-base refs/heads/main refs/remotes/origin/main [22ms]
2025-12-28 19:59:02.847 [info] > git merge-base refs/heads/main refs/remotes/origin/main [24ms]
2025-12-28 19:59:09.092 [info] > git diff --name-status -z --diff-filter=ADMR 2caf5e881c6fd6109493474331147604e935059b...refs/remotes/origin/main [6245ms]
2025-12-28 19:59:09.099 [info] > git diff --name-status -z --diff-filter=ADMR 2caf5e881c6fd6109493474331147604e935059b...refs/remotes/origin/main [6252ms]
2025-12-28 19:59:28.917 [info] > git fetch [135047ms]
2025-12-28 19:59:28.919 [info] > git status -z -uall [26126ms] (cancelled)
2025-12-28 19:59:28.936 [info] > git config --get commit.template [17ms]
2025-12-28 19:59:28.937 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 19:59:28.955 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 20:01:46.490 [info] > git status -z -uall [137551ms]
2025-12-28 20:02:04.230 [info] > git config --get commit.template [39ms]
2025-12-28 20:02:04.234 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [41ms]
2025-12-28 20:02:04.257 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 20:02:04.272 [info] > git status -z -uall [37ms]
2025-12-28 20:02:19.745 [info] > git config --get commit.template [36ms]
2025-12-28 20:02:19.748 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [37ms]
2025-12-28 20:02:19.772 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 20:02:19.789 [info] > git status -z -uall [40ms]
2025-12-28 20:02:42.182 [info] > git config --get commit.template [33ms]
2025-12-28 20:02:42.186 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 20:02:42.210 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 20:02:42.229 [info] > git status -z -uall [42ms]
2025-12-28 20:03:04.624 [info] > git config --get commit.template [22ms]
2025-12-28 20:03:04.626 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [21ms]
2025-12-28 20:03:04.642 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [15ms]
2025-12-28 20:03:04.661 [info] > git status -z -uall [35ms]
2025-12-28 20:03:14.466 [info] > git config --get commit.template [32ms]
2025-12-28 20:03:14.468 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 20:03:14.491 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 20:03:14.520 [info] > git status -z -uall [51ms]
2025-12-28 20:03:57.041 [info] > git config --get commit.template [30ms]
2025-12-28 20:03:57.044 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [30ms]
2025-12-28 20:03:57.062 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 20:03:57.082 [info] > git status -z -uall [37ms]
2025-12-28 20:04:02.115 [info] > git config --get commit.template [22ms]
2025-12-28 20:04:02.117 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [21ms]
2025-12-28 20:04:02.135 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 20:04:02.141 [info] > git status -z -uall [24ms]
2025-12-28 20:04:23.741 [info] > git config --get commit.template [29ms]
2025-12-28 20:04:23.743 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [30ms]
2025-12-28 20:04:23.763 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 20:04:23.783 [info] > git status -z -uall [39ms]
2025-12-28 20:04:43.263 [info] > git config --get commit.template [46ms]
2025-12-28 20:05:00.911 [info] > git ls-files --stage -- app/(auth)/register.tsx [20ms]
2025-12-28 20:05:00.929 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [17ms]
2025-12-28 20:05:03.635 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [20413ms]
2025-12-28 20:05:03.806 [info] > git show --textconv :app/(auth)/register.tsx [2916ms]
2025-12-28 20:05:05.608 [info] > git check-ignore -v -z --stdin [4201ms]
2025-12-28 20:05:05.893 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [35ms]
2025-12-28 20:05:12.771 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [41ms]
2025-12-28 20:05:12.772 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:12.792 [info] > git config --get-all user.name [19ms]
2025-12-28 20:05:12.815 [info] > git config --get-all user.email [22ms]
2025-12-28 20:05:12.889 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [18ms]
2025-12-28 20:05:12.889 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:12.904 [info] > git config --get-all user.name [14ms]
2025-12-28 20:05:12.919 [info] > git config --get-all user.email [14ms]
2025-12-28 20:05:13.136 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:05:13.136 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:13.150 [info] > git config --get-all user.name [14ms]
2025-12-28 20:05:13.165 [info] > git config --get-all user.email [14ms]
2025-12-28 20:05:13.635 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [17ms]
2025-12-28 20:05:13.635 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:13.651 [info] > git config --get-all user.name [15ms]
2025-12-28 20:05:13.666 [info] > git config --get-all user.email [15ms]
2025-12-28 20:05:14.503 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [31ms]
2025-12-28 20:05:14.503 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:14.526 [info] > git config --get-all user.name [22ms]
2025-12-28 20:05:14.546 [info] > git config --get-all user.email [19ms]
2025-12-28 20:05:15.826 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [24ms]
2025-12-28 20:05:15.826 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:15.846 [info] > git config --get-all user.name [19ms]
2025-12-28 20:05:15.866 [info] > git config --get-all user.email [19ms]
2025-12-28 20:05:17.710 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [36ms]
2025-12-28 20:05:17.711 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:17.729 [info] > git config --get-all user.name [17ms]
2025-12-28 20:05:17.748 [info] > git config --get-all user.email [18ms]
2025-12-28 20:05:20.239 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [34ms]
2025-12-28 20:05:20.239 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:20.261 [info] > git config --get-all user.name [21ms]
2025-12-28 20:05:20.278 [info] > git config --get-all user.email [17ms]
2025-12-28 20:05:23.525 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [41ms]
2025-12-28 20:05:23.525 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:23.546 [info] > git config --get-all user.name [20ms]
2025-12-28 20:05:23.563 [info] > git config --get-all user.email [16ms]
2025-12-28 20:05:26.947 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [26057ms]
2025-12-28 20:05:26.953 [info] > git show --textconv HEAD:app/(auth)/register.tsx [26064ms]
2025-12-28 20:05:27.014 [info] > git check-ignore -v -z --stdin [22ms]
2025-12-28 20:05:27.038 [info] > git check-ignore -v -z --stdin [19ms]
2025-12-28 20:05:27.633 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [19ms]
2025-12-28 20:05:27.633 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:27.648 [info] > git config --get-all user.name [14ms]
2025-12-28 20:05:27.662 [info] > git config --get-all user.email [13ms]
2025-12-28 20:05:32.705 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [35ms]
2025-12-28 20:05:32.705 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:05:32.726 [info] > git config --get-all user.name [20ms]
2025-12-28 20:05:32.743 [info] > git config --get-all user.email [17ms]
2025-12-28 20:05:32.744 [info] > git status -z -uall [26887ms] (cancelled)
2025-12-28 20:05:32.759 [info] > git config --get commit.template [15ms]
2025-12-28 20:05:32.760 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [15ms]
2025-12-28 20:05:32.777 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 20:08:19.201 [info] > git blame --root --incremental 2caf5e881c6fd6109493474331147604e935059b -- app/(auth)/register.tsx [172088ms]
2025-12-28 20:08:34.769 [info] > git status -z -uall [182008ms]
2025-12-28 20:08:36.110 [info] > git ls-files --stage -- app/(auth)/register.tsx [17ms]
2025-12-28 20:08:36.111 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [19ms]
2025-12-28 20:08:36.127 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [17ms]
2025-12-28 20:08:36.127 [info] > git show --textconv HEAD:app/(auth)/register.tsx [15ms]
2025-12-28 20:08:36.144 [info] > git show --textconv :app/(auth)/register.tsx [16ms]
2025-12-28 20:08:39.711 [info] > git fetch [4936ms]
2025-12-28 20:08:39.728 [info] > git config --get commit.template [17ms]
2025-12-28 20:08:39.728 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [16ms]
2025-12-28 20:08:39.747 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 20:08:40.924 [info] > git ls-files --stage -- app/(auth)/register.tsx [28ms]
2025-12-28 20:08:40.926 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [31ms]
2025-12-28 20:08:40.948 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [23ms]
2025-12-28 20:08:40.952 [info] > git show --textconv HEAD:app/(auth)/register.tsx [22ms]
2025-12-28 20:08:40.969 [info] > git show --textconv :app/(auth)/register.tsx [19ms]
2025-12-28 20:08:41.378 [info] > git show -s --decorate=full --shortstat --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z 2caf5e881c6fd6109493474331147604e935059b -- [6604ms]
2025-12-28 20:09:02.113 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [45ms]
2025-12-28 20:09:02.113 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:02.132 [info] > git config --get-all user.name [19ms]
2025-12-28 20:09:02.152 [info] > git config --get-all user.email [19ms]
2025-12-28 20:09:02.223 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [17ms]
2025-12-28 20:09:02.223 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:02.239 [info] > git config --get-all user.name [16ms]
2025-12-28 20:09:02.254 [info] > git config --get-all user.email [14ms]
2025-12-28 20:09:02.478 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [18ms]
2025-12-28 20:09:02.478 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:02.496 [info] > git config --get-all user.name [17ms]
2025-12-28 20:09:02.512 [info] > git config --get-all user.email [16ms]
2025-12-28 20:09:02.993 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [30ms]
2025-12-28 20:09:02.993 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:03.016 [info] > git config --get-all user.name [22ms]
2025-12-28 20:09:03.034 [info] > git config --get-all user.email [18ms]
2025-12-28 20:09:03.855 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [14ms]
2025-12-28 20:09:03.856 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:03.870 [info] > git config --get-all user.name [14ms]
2025-12-28 20:09:03.885 [info] > git config --get-all user.email [15ms]
2025-12-28 20:09:05.170 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [32ms]
2025-12-28 20:09:05.170 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:05.192 [info] > git config --get-all user.name [21ms]
2025-12-28 20:09:05.210 [info] > git config --get-all user.email [17ms]
2025-12-28 20:09:07.038 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [25ms]
2025-12-28 20:09:07.038 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:07.062 [info] > git config --get-all user.name [23ms]
2025-12-28 20:09:07.082 [info] > git config --get-all user.email [19ms]
2025-12-28 20:09:09.575 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [35ms]
2025-12-28 20:09:09.575 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:09.598 [info] > git config --get-all user.name [22ms]
2025-12-28 20:09:09.617 [info] > git config --get-all user.email [18ms]
2025-12-28 20:09:12.838 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:09:12.838 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:12.858 [info] > git config --get-all user.name [20ms]
2025-12-28 20:09:12.875 [info] > git config --get-all user.email [16ms]
2025-12-28 20:09:13.365 [info] > git check-ignore -v -z --stdin [27ms]
2025-12-28 20:09:16.965 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [33ms]
2025-12-28 20:09:16.965 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:16.986 [info] > git config --get-all user.name [20ms]
2025-12-28 20:09:17.005 [info] > git config --get-all user.email [18ms]
2025-12-28 20:09:22.040 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [33ms]
2025-12-28 20:09:22.040 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:09:22.063 [info] > git config --get-all user.name [22ms]
2025-12-28 20:09:22.081 [info] > git config --get-all user.email [18ms]
2025-12-28 20:09:22.082 [info] > git status -z -uall [42353ms] (cancelled)
2025-12-28 20:09:22.098 [info] > git config --get commit.template [16ms]
2025-12-28 20:09:22.100 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 20:09:22.118 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 20:09:22.534 [info] > git status -z -uall [433ms]
2025-12-28 20:09:22.579 [info] > git show -s --decorate=full --shortstat --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z 2caf5e881c6fd6109493474331147604e935059b -- [41ms]
2025-12-28 20:09:29.616 [info] > git log --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z --shortstat --diff-merges=first-parent -n50 --skip=0 --topo-order --decorate=full --stdin [626791ms]
2025-12-28 20:09:36.506 [info] > git config --get commit.template [43ms]
2025-12-28 20:09:36.514 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [51ms]
2025-12-28 20:09:36.573 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [58ms]
2025-12-28 20:09:46.249 [info] > git check-ignore -v -z --stdin [37ms]
2025-12-28 20:10:11.694 [info] > git ls-files --stage -- app/(auth)/register.tsx [26ms]
2025-12-28 20:10:11.697 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [30ms]
2025-12-28 20:10:11.716 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [21ms]
2025-12-28 20:10:11.719 [info] > git show --textconv HEAD:app/(auth)/register.tsx [21ms]
2025-12-28 20:10:11.737 [info] > git show --textconv :app/(auth)/register.tsx [20ms]
2025-12-28 20:10:12.078 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:10:12.078 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:12.096 [info] > git config --get-all user.name [17ms]
2025-12-28 20:10:12.118 [info] > git config --get-all user.email [21ms]
2025-12-28 20:10:12.192 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [19ms]
2025-12-28 20:10:12.192 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:12.210 [info] > git config --get-all user.name [17ms]
2025-12-28 20:10:12.226 [info] > git config --get-all user.email [16ms]
2025-12-28 20:10:12.450 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [20ms]
2025-12-28 20:10:12.450 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:12.469 [info] > git config --get-all user.name [18ms]
2025-12-28 20:10:12.485 [info] > git config --get-all user.email [16ms]
2025-12-28 20:10:12.956 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:10:12.956 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:12.972 [info] > git config --get-all user.name [15ms]
2025-12-28 20:10:12.987 [info] > git config --get-all user.email [15ms]
2025-12-28 20:10:13.809 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [16ms]
2025-12-28 20:10:13.809 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:13.826 [info] > git config --get-all user.name [16ms]
2025-12-28 20:10:13.843 [info] > git config --get-all user.email [17ms]
2025-12-28 20:10:13.936 [info] > git status -z -uall [37421ms]
2025-12-28 20:10:15.114 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [17ms]
2025-12-28 20:10:15.114 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:15.160 [info] > git config --get-all user.name [45ms]
2025-12-28 20:10:15.210 [info] > git config --get-all user.email [49ms]
2025-12-28 20:10:17.043 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [31ms]
2025-12-28 20:10:17.043 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:17.065 [info] > git config --get-all user.name [21ms]
2025-12-28 20:10:17.083 [info] > git config --get-all user.email [18ms]
2025-12-28 20:10:19.562 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [22ms]
2025-12-28 20:10:19.562 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:19.579 [info] > git config --get-all user.name [17ms]
2025-12-28 20:10:19.597 [info] > git config --get-all user.email [17ms]
2025-12-28 20:10:22.834 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [31ms]
2025-12-28 20:10:22.834 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:22.857 [info] > git config --get-all user.name [22ms]
2025-12-28 20:10:22.875 [info] > git config --get-all user.email [18ms]
2025-12-28 20:10:26.958 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [26ms]
2025-12-28 20:10:26.958 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:26.976 [info] > git config --get-all user.name [18ms]
2025-12-28 20:10:26.995 [info] > git config --get-all user.email [18ms]
2025-12-28 20:10:32.014 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [17ms]
2025-12-28 20:10:32.014 [info] fatal: Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/index.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 20:10:32.031 [info] > git config --get-all user.name [16ms]
2025-12-28 20:10:32.048 [info] > git config --get-all user.email [16ms]
2025-12-28 20:10:32.067 [info] > git config --get commit.template [17ms]
2025-12-28 20:10:32.069 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [19ms]
2025-12-28 20:10:32.090 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 20:10:32.111 [info] > git status -z -uall [41ms]
2025-12-28 20:10:32.135 [info] > git show -s --decorate=full --shortstat --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z 2caf5e881c6fd6109493474331147604e935059b -- [22ms]
2025-12-28 20:10:56.031 [info] > git config --get commit.template [23ms]
2025-12-28 20:10:56.034 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [25ms]
2025-12-28 20:10:56.141 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [104ms]
2025-12-28 20:10:56.162 [info] > git status -z -uall [125ms]
2025-12-28 20:10:58.039 [info] > git ls-files --stage -- app/(auth)/register.tsx [34ms]
2025-12-28 20:10:58.041 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [38ms]
2025-12-28 20:10:58.064 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [24ms]
2025-12-28 20:10:58.070 [info] > git show --textconv HEAD:app/(auth)/register.tsx [26ms]
2025-12-28 20:10:58.086 [info] > git show --textconv :app/(auth)/register.tsx [20ms]
2025-12-28 20:11:01.196 [info] > git config --get commit.template [22ms]
2025-12-28 20:11:01.197 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [22ms]
2025-12-28 20:11:01.227 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [28ms]
2025-12-28 20:11:01.235 [info] > git status -z -uall [36ms]
2025-12-28 20:11:09.005 [info] > git config --get commit.template [25ms]
2025-12-28 20:11:09.008 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [28ms]
2025-12-28 20:11:09.029 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [20ms]
2025-12-28 20:11:09.041 [info] > git status -z -uall [33ms]
2025-12-28 20:11:31.152 [info] > git config --get commit.template [31ms]
2025-12-28 20:11:31.157 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [35ms]
2025-12-28 20:11:31.186 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [27ms]
2025-12-28 20:11:31.242 [info] > git status -z -uall [84ms]
2025-12-28 20:11:54.667 [info] > git config --get commit.template [32ms]
2025-12-28 20:11:54.669 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 20:11:54.697 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [26ms]
2025-12-28 20:11:54.705 [info] > git status -z -uall [35ms]
2025-12-28 20:12:05.479 [info] > git config --get commit.template [20ms]
2025-12-28 20:12:05.480 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [21ms]
2025-12-28 20:12:05.498 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 20:12:05.506 [info] > git status -z -uall [26ms]
2025-12-28 20:12:11.501 [info] > git config --get commit.template [16ms]
2025-12-28 20:12:11.503 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 20:12:11.523 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 20:12:11.524 [info] > git status -z -uall [20ms]
2025-12-28 20:12:12.619 [info] > git ls-files --stage -- app/(auth)/register.tsx [15ms]
2025-12-28 20:12:12.621 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [18ms]
2025-12-28 20:12:12.638 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [18ms]
2025-12-28 20:12:12.639 [info] > git show --textconv HEAD:app/(auth)/register.tsx [17ms]
2025-12-28 20:12:12.662 [info] > git show --textconv :app/(auth)/register.tsx [19ms]
2025-12-28 20:12:16.549 [info] > git config --get commit.template [17ms]
2025-12-28 20:12:16.550 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [18ms]
2025-12-28 20:12:16.571 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [20ms]
2025-12-28 20:12:16.573 [info] > git status -z -uall [22ms]
2025-12-28 20:12:21.604 [info] > git config --get commit.template [20ms]
2025-12-28 20:12:21.605 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [21ms]
2025-12-28 20:12:21.624 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 20:12:21.624 [info] > git status -z -uall [18ms]
2025-12-28 20:12:22.723 [info] > git fetch [631ms]
2025-12-28 20:12:22.740 [info] > git config --get commit.template [16ms]
2025-12-28 20:12:22.741 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [14ms]
2025-12-28 20:12:22.762 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 20:12:22.763 [info] > git status -z -uall [21ms]
2025-12-28 20:12:23.925 [info] > git ls-files --stage -- app/(auth)/register.tsx [15ms]
2025-12-28 20:12:23.944 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [18ms]
2025-12-28 20:12:23.964 [info] > git show --textconv :app/(auth)/register.tsx [19ms]
2025-12-28 20:12:26.651 [info] > git config --get commit.template [19ms]
2025-12-28 20:12:59.555 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32920ms]
2025-12-28 20:12:59.581 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [25ms]
2025-12-28 20:13:06.395 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [42486ms]
2025-12-28 20:13:06.417 [info] > git show --textconv HEAD:app/(auth)/register.tsx [19ms]
2025-12-28 20:13:30.725 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [14463ms]
2025-12-28 20:13:30.750 [info] > git config --get commit.template [22ms]
2025-12-28 20:13:30.753 [info] > git status -z -uall [31197ms] (cancelled)
2025-12-28 20:13:30.779 [info] > git config --get commit.template [26ms]
2025-12-28 20:13:44.473 [info] > git ls-files --stage -- app/(auth)/register.tsx [36ms]
2025-12-28 20:13:44.482 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [46ms]
2025-12-28 20:13:44.503 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [29ms]
2025-12-28 20:13:44.509 [info] > git show --textconv HEAD:app/(auth)/register.tsx [26ms]
2025-12-28 20:13:44.540 [info] > git show --textconv :app/(auth)/register.tsx [36ms]
2025-12-28 20:13:51.468 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [20715ms]
2025-12-28 20:13:51.503 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [32ms]
2025-12-28 20:13:51.510 [info] > git status -z -uall [40ms]
2025-12-28 20:13:51.541 [info] > git merge-base refs/heads/main refs/remotes/origin/main [25ms]
2025-12-28 20:13:51.543 [info] > git log --oneline --cherry main...main@{upstream} -- [23ms]
2025-12-28 20:13:51.569 [info] > git diff --name-status -z --diff-filter=ADMR 2caf5e881c6fd6109493474331147604e935059b...refs/remotes/origin/main [27ms]
2025-12-28 20:13:52.146 [info] > git pull --tags origin main [601ms]
2025-12-28 20:13:52.146 [info] From https://github.com/gwendolinecapu/app
 * branch            main       -> FETCH_HEAD
2025-12-28 20:13:53.343 [info] > git ls-files --stage -- app/(auth)/register.tsx [15ms]
2025-12-28 20:13:53.344 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [17ms]
2025-12-28 20:13:53.363 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [19ms]
2025-12-28 20:13:53.364 [info] > git show --textconv HEAD:app/(auth)/register.tsx [16ms]
2025-12-28 20:13:53.382 [info] > git show --textconv :app/(auth)/register.tsx [17ms]
2025-12-28 20:14:18.022 [info] > git show -s --decorate=full --shortstat --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z db35e5e899df63b912218f7b0de019c684757f3f -- [26506ms]
2025-12-28 20:14:35.397 [info] > git ls-files --stage -- app/(auth)/register.tsx [72ms]
2025-12-28 20:14:35.403 [info] > git ls-tree -l HEAD -- app/(auth)/register.tsx [79ms]
2025-12-28 20:14:35.419 [info] > git cat-file -s 63f7208a78831fe6b61d8aeb6b4f78d18d865b3a [21ms]
2025-12-28 20:50:17.759 [info] > git show --textconv HEAD:app/(auth)/register.tsx [2142355ms]
2025-12-28 20:50:17.800 [info] > git show --textconv :app/(auth)/register.tsx [2142380ms]
2025-12-28 21:31:39.504 [info] > git push origin main:main [4667356ms]
2025-12-28 21:31:39.505 [info] To https://github.com/gwendolinecapu/app.git
   2caf5e8..db35e5e  main -> main
2025-12-28 21:31:39.586 [info] > git config --get commit.template [77ms]
2025-12-28 21:31:39.589 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [81ms]
2025-12-28 21:31:39.608 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 21:31:59.578 [info] > git status -z -uall [19988ms]
2025-12-28 21:31:59.618 [info] > git merge-base refs/heads/main refs/remotes/origin/main [35ms]
2025-12-28 21:31:59.621 [info] > git config --get commit.template [27ms]
2025-12-28 21:31:59.623 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [28ms]
2025-12-28 21:31:59.642 [info] > git diff --name-status -z --diff-filter=ADMR db35e5e899df63b912218f7b0de019c684757f3f...refs/remotes/origin/main [23ms]
2025-12-28 21:31:59.646 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 21:32:01.407 [info] > git status -z -uall [1783ms]
2025-12-28 21:32:15.581 [info] > git fetch [14170ms]
2025-12-28 21:32:15.607 [info] > git config --get commit.template [24ms]
2025-12-28 21:32:15.609 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [26ms]
2025-12-28 21:32:15.629 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 21:32:15.631 [info] > git status -z -uall [21ms]
2025-12-28 21:32:16.676 [info] > git config --get commit.template [16ms]
2025-12-28 21:32:16.677 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 21:32:16.695 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 21:32:16.695 [info] > git status -z -uall [17ms]
2025-12-28 21:32:27.137 [info] > git config --get commit.template [31ms]
2025-12-28 21:32:27.139 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 21:32:27.164 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:32:27.165 [info] > git status -z -uall [25ms]
2025-12-28 21:32:35.310 [info] > git config --get commit.template [31ms]
2025-12-28 21:32:35.312 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 21:32:35.335 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:32:35.336 [info] > git status -z -uall [23ms]
2025-12-28 21:32:43.885 [info] > git config --get commit.template [30ms]
2025-12-28 21:32:43.887 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 21:32:43.911 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:32:43.913 [info] > git status -z -uall [25ms]
2025-12-28 21:32:56.731 [info] > git config --get commit.template [16ms]
2025-12-28 21:32:56.732 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [16ms]
2025-12-28 21:32:56.749 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 21:32:56.749 [info] > git status -z -uall [16ms]
2025-12-28 21:33:03.580 [info] > git config --get commit.template [29ms]
2025-12-28 21:33:03.582 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [30ms]
2025-12-28 21:33:03.606 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:33:03.608 [info] > git status -z -uall [25ms]
2025-12-28 21:33:13.503 [info] > git config --get commit.template [35ms]
2025-12-28 21:33:13.506 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [37ms]
2025-12-28 21:33:13.528 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 21:33:13.532 [info] > git status -z -uall [25ms]
2025-12-28 21:33:29.028 [info] > git config --get commit.template [29ms]
2025-12-28 21:33:29.030 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [30ms]
2025-12-28 21:33:29.054 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:33:29.056 [info] > git status -z -uall [25ms]
2025-12-28 21:33:41.967 [info] > git config --get commit.template [34ms]
2025-12-28 21:33:41.968 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 21:33:41.993 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:33:41.993 [info] > git status -z -uall [24ms]
2025-12-28 21:33:58.652 [info] > git config --get commit.template [33ms]
2025-12-28 21:33:58.654 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 21:33:58.678 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:33:58.679 [info] > git status -z -uall [24ms]
2025-12-28 21:34:12.339 [info] > git config --get commit.template [30ms]
2025-12-28 21:34:12.341 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 21:34:12.365 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:34:12.367 [info] > git status -z -uall [25ms]
2025-12-28 21:34:28.667 [info] > git config --get commit.template [45ms]
2025-12-28 21:34:28.671 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [46ms]
2025-12-28 21:34:28.694 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [20ms]
2025-12-28 21:34:28.697 [info] > git status -z -uall [24ms]
2025-12-28 21:34:35.870 [info] > git config --get commit.template [31ms]
2025-12-28 21:34:35.872 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 21:34:35.896 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:34:35.897 [info] > git status -z -uall [24ms]
2025-12-28 21:34:39.131 [info] > git log --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z --shortstat --diff-merges=first-parent -n50 --skip=0 --topo-order --decorate=full --stdin [4847603ms]
2025-12-28 21:34:45.866 [info] > git config --get commit.template [33ms]
2025-12-28 21:34:45.868 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 21:34:45.892 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:34:45.893 [info] > git status -z -uall [24ms]
2025-12-28 21:34:50.932 [info] > git config --get commit.template [33ms]
2025-12-28 21:34:50.933 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 21:34:50.958 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:34:50.959 [info] > git status -z -uall [25ms]
2025-12-28 21:34:59.352 [info] > git config --get commit.template [17ms]
2025-12-28 21:34:59.353 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 21:34:59.369 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [15ms]
2025-12-28 21:34:59.370 [info] > git status -z -uall [16ms]
2025-12-28 21:35:04.408 [info] > git config --get commit.template [33ms]
2025-12-28 21:35:04.409 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 21:35:04.434 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:35:04.435 [info] > git status -z -uall [24ms]
2025-12-28 21:35:11.962 [info] > git config --get commit.template [35ms]
2025-12-28 21:35:11.964 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [36ms]
2025-12-28 21:35:11.990 [info] > git status -z -uall [25ms]
2025-12-28 21:35:11.991 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 21:35:16.653 [info] > git fetch [1023ms]
2025-12-28 21:35:16.676 [info] > git config --get commit.template [21ms]
2025-12-28 21:35:16.677 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [22ms]
2025-12-28 21:35:16.698 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 21:35:16.699 [info] > git status -z -uall [21ms]
2025-12-28 21:35:18.279 [info] > git config --get commit.template [33ms]
2025-12-28 21:35:18.280 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 21:35:18.305 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:35:18.306 [info] > git status -z -uall [24ms]
2025-12-28 21:35:29.075 [info] > git config --get commit.template [25ms]
2025-12-28 21:35:29.076 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [25ms]
2025-12-28 21:35:29.095 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 21:35:29.096 [info] > git status -z -uall [19ms]
2025-12-28 21:35:34.136 [info] > git config --get commit.template [33ms]
2025-12-28 21:35:34.138 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 21:35:34.162 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:35:34.163 [info] > git status -z -uall [24ms]
2025-12-28 21:35:41.681 [info] > git config --get commit.template [22ms]
2025-12-28 21:35:41.682 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [22ms]
2025-12-28 21:35:41.705 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:35:41.706 [info] > git status -z -uall [24ms]
2025-12-28 21:35:46.744 [info] > git config --get commit.template [33ms]
2025-12-28 21:35:46.746 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 21:35:46.770 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:35:46.771 [info] > git status -z -uall [24ms]
2025-12-28 21:35:55.561 [info] > git config --get commit.template [33ms]
2025-12-28 21:35:55.563 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 21:35:55.587 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:35:55.589 [info] > git status -z -uall [25ms]
2025-12-28 21:36:00.631 [info] > git config --get commit.template [32ms]
2025-12-28 21:36:00.633 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 21:36:00.657 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:36:00.658 [info] > git status -z -uall [24ms]
2025-12-28 21:36:10.614 [info] > git config --get commit.template [33ms]
2025-12-28 21:36:10.615 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 21:36:10.632 [info] > git status -z -uall [17ms]
2025-12-28 21:36:10.635 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 21:36:15.674 [info] > git config --get commit.template [34ms]
2025-12-28 21:36:15.675 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 21:36:15.701 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 21:36:15.701 [info] > git status -z -uall [24ms]
2025-12-28 21:36:23.471 [info] > git config --get commit.template [32ms]
2025-12-28 21:36:23.473 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 21:36:23.497 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:36:23.499 [info] > git status -z -uall [25ms]
2025-12-28 21:36:30.206 [info] > git config --get commit.template [28ms]
2025-12-28 21:36:30.207 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [27ms]
2025-12-28 21:36:30.230 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:36:30.231 [info] > git status -z -uall [23ms]
2025-12-28 21:36:40.299 [info] > git config --get commit.template [33ms]
2025-12-28 21:36:40.301 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 21:36:40.325 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:36:40.326 [info] > git status -z -uall [24ms]
2025-12-28 21:36:45.351 [info] > git config --get commit.template [16ms]
2025-12-28 21:36:45.352 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [16ms]
2025-12-28 21:36:45.371 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 21:36:45.372 [info] > git status -z -uall [19ms]
2025-12-28 21:36:54.104 [info] > git config --get commit.template [36ms]
2025-12-28 21:36:54.106 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [36ms]
2025-12-28 21:36:54.131 [info] > git status -z -uall [24ms]
2025-12-28 21:36:54.131 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:37:00.843 [info] > git config --get commit.template [31ms]
2025-12-28 21:37:00.844 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 21:37:00.864 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 21:37:00.864 [info] > git status -z -uall [19ms]
2025-12-28 21:37:13.663 [info] > git config --get commit.template [48ms]
2025-12-28 21:37:13.668 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [52ms]
2025-12-28 21:37:13.687 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 21:37:40.799 [info] > git status -z -uall [27130ms]
2025-12-28 21:37:46.199 [info] > git config --get commit.template [32ms]
2025-12-28 21:37:46.201 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 21:37:46.224 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:37:46.225 [info] > git status -z -uall [23ms]
2025-12-28 21:37:51.264 [info] > git config --get commit.template [30ms]
2025-12-28 21:37:51.266 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 21:37:51.289 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 21:38:06.704 [info] > git status -z -uall [15437ms]
2025-12-28 21:38:11.733 [info] > git config --get commit.template [24ms]
2025-12-28 21:38:11.738 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [29ms]
2025-12-28 21:38:11.769 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [30ms]
2025-12-28 21:38:11.778 [info] > git status -z -uall [40ms]
2025-12-28 21:38:30.785 [info] > git fetch [14085ms]
2025-12-28 21:38:30.811 [info] > git config --get commit.template [24ms]
2025-12-28 21:38:30.812 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [24ms]
2025-12-28 21:38:30.836 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:38:30.839 [info] > git status -z -uall [26ms]
2025-12-28 21:38:31.902 [info] > git config --get commit.template [33ms]
2025-12-28 21:38:31.903 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 21:38:31.928 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:38:31.929 [info] > git status -z -uall [24ms]
2025-12-28 21:38:43.297 [info] > git config --get commit.template [109ms]
2025-12-28 21:38:43.308 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [121ms]
2025-12-28 21:38:43.325 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 21:38:43.334 [info] > git status -z -uall [26ms]
2025-12-28 21:38:48.358 [info] > git config --get commit.template [17ms]
2025-12-28 21:38:48.360 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [19ms]
2025-12-28 21:38:48.377 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 21:38:48.378 [info] > git status -z -uall [18ms]
2025-12-28 21:39:05.821 [info] > git config --get commit.template [21ms]
2025-12-28 21:39:05.823 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [22ms]
2025-12-28 21:39:05.846 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:39:05.850 [info] > git status -z -uall [27ms]
2025-12-28 21:39:16.554 [info] > git config --get commit.template [24ms]
2025-12-28 21:39:16.557 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [27ms]
2025-12-28 21:39:16.576 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 21:39:16.578 [info] > git status -z -uall [20ms]
2025-12-28 21:39:27.767 [info] > git config --get commit.template [50ms]
2025-12-28 21:39:27.774 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [56ms]
2025-12-28 21:39:27.795 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 21:39:27.802 [info] > git status -z -uall [27ms]
2025-12-28 21:39:35.433 [info] > git config --get commit.template [30ms]
2025-12-28 21:39:35.434 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [30ms]
2025-12-28 21:39:35.456 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 21:39:35.457 [info] > git status -z -uall [21ms]
2025-12-28 21:39:44.313 [info] > git config --get commit.template [26ms]
2025-12-28 21:39:44.315 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [27ms]
2025-12-28 21:39:44.341 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 21:39:44.343 [info] > git status -z -uall [27ms]
2025-12-28 21:40:00.110 [info] > git config --get commit.template [31ms]
2025-12-28 21:40:00.112 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 21:40:00.136 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:40:00.137 [info] > git status -z -uall [24ms]
2025-12-28 21:40:17.552 [info] > git config --get commit.template [31ms]
2025-12-28 21:40:17.554 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 21:40:17.578 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:40:17.579 [info] > git status -z -uall [24ms]
2025-12-28 21:40:22.614 [info] > git config --get commit.template [30ms]
2025-12-28 21:40:22.616 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 21:40:22.640 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:40:22.641 [info] > git status -z -uall [24ms]
2025-12-28 21:40:33.799 [info] > git config --get commit.template [24ms]
2025-12-28 21:40:33.802 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [26ms]
2025-12-28 21:40:33.824 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 21:40:33.829 [info] > git status -z -uall [26ms]
2025-12-28 21:40:41.614 [info] > git config --get commit.template [15ms]
2025-12-28 21:40:41.615 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [15ms]
2025-12-28 21:40:41.632 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 21:40:41.634 [info] > git status -z -uall [18ms]
2025-12-28 21:40:51.604 [info] > git config --get commit.template [18ms]
2025-12-28 21:40:51.605 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [18ms]
2025-12-28 21:40:51.624 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 21:40:51.626 [info] > git status -z -uall [20ms]
2025-12-28 21:40:59.287 [info] > git config --get commit.template [20ms]
2025-12-28 21:40:59.288 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [19ms]
2025-12-28 21:40:59.309 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [20ms]
2025-12-28 21:40:59.311 [info] > git status -z -uall [22ms]
2025-12-28 21:41:31.443 [info] > git fetch [602ms]
2025-12-28 21:41:31.463 [info] > git config --get commit.template [19ms]
2025-12-28 21:41:31.464 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [18ms]
2025-12-28 21:41:31.485 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 21:41:31.489 [info] > git status -z -uall [24ms]
2025-12-28 21:41:32.566 [info] > git config --get commit.template [32ms]
2025-12-28 21:41:32.568 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 21:41:32.593 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:41:32.594 [info] > git status -z -uall [25ms]
2025-12-28 21:42:12.144 [info] > git config --get commit.template [35ms]
2025-12-28 21:42:12.147 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [36ms]
2025-12-28 21:42:12.173 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 21:42:12.177 [info] > git status -z -uall [29ms]
2025-12-28 21:42:18.795 [info] > git config --get commit.template [16ms]
2025-12-28 21:42:18.796 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 21:42:18.818 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [20ms]
2025-12-28 21:52:58.333 [info] > git status -z -uall [639536ms]
2025-12-28 21:52:58.567 [info] > git config --get commit.template [181ms]
2025-12-28 21:52:58.574 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [181ms]
2025-12-28 21:52:58.591 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [15ms]
2025-12-28 21:58:48.005 [info] > git status -z -uall [349429ms]
2025-12-28 21:58:52.715 [info] > git fetch [4707ms]
2025-12-28 21:58:52.715 [info] error: rev-list died of signal 10
error: rev-list died of signal 10
error: https://github.com/gwendolinecapu/app.git did not send all necessary objects
2025-12-28 21:58:52.734 [info] > git config --get commit.template [16ms]
2025-12-28 21:58:52.735 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 21:58:52.752 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [15ms]
2025-12-28 21:58:58.751 [info] > git status -z -uall [6015ms]
2025-12-28 21:59:06.354 [info] > git config --get commit.template [29ms]
2025-12-28 21:59:06.356 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [30ms]
2025-12-28 21:59:06.379 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 21:59:12.739 [info] > git status -z -uall [6382ms]
2025-12-28 21:59:12.755 [info] > git config --get commit.template [15ms]
2025-12-28 21:59:12.756 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [15ms]
2025-12-28 21:59:12.773 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [15ms]
2025-12-28 21:59:21.808 [info] > git status -z -uall [9051ms]
2025-12-28 21:59:27.493 [info] > git config --get commit.template [32ms]
2025-12-28 21:59:27.495 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 21:59:27.520 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 21:59:31.539 [info] > git status -z -uall [4043ms]
2025-12-28 21:59:31.558 [info] > git config --get commit.template [18ms]
2025-12-28 21:59:31.559 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [18ms]
2025-12-28 21:59:31.576 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 21:59:36.257 [info] > git status -z -uall [4697ms]
2025-12-28 21:59:40.493 [info] > git config --get commit.template [35ms]
2025-12-28 21:59:40.494 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 21:59:40.518 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 21:59:41.491 [info] > git status -z -uall [996ms]
2025-12-28 21:59:46.516 [info] > git config --get commit.template [16ms]
2025-12-28 21:59:46.518 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 21:59:46.535 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 21:59:46.539 [info] > git status -z -uall [20ms]
2025-12-28 21:59:51.558 [info] > git config --get commit.template [17ms]
2025-12-28 21:59:51.559 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 21:59:51.576 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 21:59:51.579 [info] > git status -z -uall [19ms]
2025-12-28 21:59:56.604 [info] > git config --get commit.template [17ms]
2025-12-28 21:59:56.605 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [18ms]
2025-12-28 21:59:56.623 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 21:59:57.828 [info] > git status -z -uall [1222ms]
2025-12-28 21:59:57.844 [info] > git config --get commit.template [15ms]
2025-12-28 21:59:57.845 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [15ms]
2025-12-28 21:59:57.862 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 22:00:01.921 [info] > git status -z -uall [4076ms]
2025-12-28 22:00:15.806 [info] > git config --get commit.template [31ms]
2025-12-28 22:00:15.809 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 22:00:15.826 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 22:00:15.833 [info] > git status -z -uall [23ms]
2025-12-28 22:00:32.114 [info] > git config --get commit.template [36ms]
2025-12-28 22:00:32.117 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [37ms]
2025-12-28 22:00:32.140 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 22:00:32.151 [info] > git status -z -uall [33ms]
2025-12-28 22:00:37.173 [info] > git config --get commit.template [15ms]
2025-12-28 22:00:37.174 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [16ms]
2025-12-28 22:00:37.192 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 22:00:37.196 [info] > git status -z -uall [22ms]
2025-12-28 22:00:42.220 [info] > git config --get commit.template [17ms]
2025-12-28 22:00:42.221 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [18ms]
2025-12-28 22:00:42.240 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 22:00:42.244 [info] > git status -z -uall [22ms]
2025-12-28 22:00:47.268 [info] > git config --get commit.template [18ms]
2025-12-28 22:00:47.269 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [18ms]
2025-12-28 22:00:47.287 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 22:00:47.292 [info] > git status -z -uall [22ms]
2025-12-28 22:00:52.334 [info] > git config --get commit.template [35ms]
2025-12-28 22:00:52.337 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [37ms]
2025-12-28 22:00:52.363 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 22:00:52.368 [info] > git status -z -uall [30ms]
2025-12-28 22:00:57.390 [info] > git config --get commit.template [14ms]
2025-12-28 22:00:57.391 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [16ms]
2025-12-28 22:00:57.408 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 22:00:57.413 [info] > git status -z -uall [22ms]
2025-12-28 22:01:02.436 [info] > git config --get commit.template [21ms]
2025-12-28 22:01:02.437 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [22ms]
2025-12-28 22:01:02.454 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 22:01:02.458 [info] > git status -z -uall [20ms]
2025-12-28 22:01:10.213 [info] > git config --get commit.template [31ms]
2025-12-28 22:01:10.215 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 22:01:10.239 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 22:01:10.244 [info] > git status -z -uall [28ms]
2025-12-28 22:01:15.282 [info] > git config --get commit.template [33ms]
2025-12-28 22:01:15.284 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 22:01:15.308 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 22:01:15.314 [info] > git status -z -uall [28ms]
2025-12-28 22:01:29.033 [info] > git config --get commit.template [31ms]
2025-12-28 22:01:29.035 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 22:01:29.060 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 22:01:33.707 [info] > git status -z -uall [4671ms]
2025-12-28 22:01:33.724 [info] > git config --get commit.template [16ms]
2025-12-28 22:01:33.725 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [16ms]
2025-12-28 22:01:33.742 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 22:01:35.915 [info] > git status -z -uall [2189ms]
2025-12-28 22:02:03.736 [info] > git fetch [4982ms]
2025-12-28 22:02:03.736 [info] error: rev-list died of signal 10
error: rev-list died of signal 10
error: https://github.com/gwendolinecapu/app.git did not send all necessary objects
2025-12-28 22:02:03.752 [info] > git config --get commit.template [15ms]
2025-12-28 22:02:03.753 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [15ms]
2025-12-28 22:02:03.770 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 22:02:14.348 [info] > git status -z -uall [10595ms]
2025-12-28 22:02:50.923 [info] > git config --get commit.template [59ms]
2025-12-28 22:02:50.924 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [44ms]
2025-12-28 22:02:50.942 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 22:03:05.773 [info] > git status -z -uall [14848ms]
2025-12-28 22:05:18.472 [info] > git fetch [4169ms]
2025-12-28 22:05:18.499 [info] > git config --get commit.template [25ms]
2025-12-28 22:05:18.500 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [25ms]
2025-12-28 22:05:18.520 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 22:05:18.532 [info] > git status -z -uall [31ms]
2025-12-28 22:05:19.580 [info] > git config --get commit.template [33ms]
2025-12-28 22:05:19.582 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 22:05:19.605 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 22:05:19.611 [info] > git status -z -uall [28ms]
2025-12-28 22:05:25.848 [info] > git config --get commit.template [34ms]
2025-12-28 22:05:25.850 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 22:05:25.868 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 22:05:25.874 [info] > git status -z -uall [23ms]
2025-12-28 22:05:33.960 [info] > git config --get commit.template [34ms]
2025-12-28 22:05:33.964 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [37ms]
2025-12-28 22:05:33.987 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 22:05:33.992 [info] > git status -z -uall [27ms]
2025-12-28 22:05:39.022 [info] > git config --get commit.template [24ms]
2025-12-28 22:05:39.024 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [25ms]
2025-12-28 22:05:39.044 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [19ms]
2025-12-28 22:05:39.050 [info] > git status -z -uall [25ms]
2025-12-28 22:05:44.091 [info] > git config --get commit.template [33ms]
2025-12-28 22:05:44.093 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 22:05:44.117 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 22:05:44.123 [info] > git status -z -uall [28ms]
2025-12-28 22:06:09.439 [info] > git config --get commit.template [42ms]
2025-12-28 22:06:09.445 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [48ms]
2025-12-28 22:06:09.464 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 22:06:09.477 [info] > git status -z -uall [31ms]
2025-12-28 22:06:14.510 [info] > git config --get commit.template [28ms]
2025-12-28 22:06:14.513 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [30ms]
2025-12-28 22:06:14.543 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [28ms]
2025-12-28 22:06:14.548 [info] > git status -z -uall [34ms]
2025-12-28 22:06:19.583 [info] > git config --get commit.template [30ms]
2025-12-28 22:06:19.585 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 22:06:19.610 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 22:06:19.615 [info] > git status -z -uall [29ms]
2025-12-28 22:06:24.648 [info] > git config --get commit.template [30ms]
2025-12-28 22:06:24.650 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 22:06:24.674 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 22:06:24.679 [info] > git status -z -uall [28ms]
2025-12-28 22:06:29.715 [info] > git config --get commit.template [33ms]
2025-12-28 22:06:29.717 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 22:06:29.741 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 22:06:29.746 [info] > git status -z -uall [28ms]
2025-12-28 22:06:34.785 [info] > git config --get commit.template [31ms]
2025-12-28 22:06:34.786 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 22:06:34.811 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 22:06:34.817 [info] > git status -z -uall [30ms]
2025-12-28 22:06:40.690 [info] > git config --get commit.template [35ms]
2025-12-28 22:06:40.692 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [36ms]
2025-12-28 22:06:40.716 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 22:06:40.720 [info] > git status -z -uall [27ms]
2025-12-28 22:06:45.760 [info] > git config --get commit.template [31ms]
2025-12-28 22:06:45.762 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 22:06:45.788 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 22:06:45.793 [info] > git status -z -uall [30ms]
2025-12-28 22:06:50.834 [info] > git config --get commit.template [33ms]
2025-12-28 22:06:50.836 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [34ms]
2025-12-28 22:06:50.863 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [26ms]
2025-12-28 22:06:50.863 [info] > git status -z -uall [26ms]
2025-12-28 22:06:55.901 [info] > git config --get commit.template [33ms]
2025-12-28 22:06:55.903 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 22:06:55.927 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 22:07:00.029 [info] > git status -z -uall [4125ms]
2025-12-28 22:07:00.743 [info] > git check-ignore -v -z --stdin [81ms]
2025-12-28 22:07:05.046 [info] > git config --get commit.template [15ms]
2025-12-28 22:07:05.047 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [16ms]
2025-12-28 22:07:05.066 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 22:07:05.068 [info] > git status -z -uall [19ms]
2025-12-28 22:07:10.101 [info] > git config --get commit.template [26ms]
2025-12-28 22:07:10.102 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [27ms]
2025-12-28 22:07:10.124 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [20ms]
2025-12-28 22:07:10.125 [info] > git status -z -uall [22ms]
2025-12-28 22:07:13.113 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [170ms]
2025-12-28 22:07:13.113 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:13.133 [info] > git config --get-all user.name [19ms]
2025-12-28 22:07:13.158 [info] > git config --get-all user.email [25ms]
2025-12-28 22:07:13.382 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [171ms]
2025-12-28 22:07:13.382 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:13.402 [info] > git config --get-all user.name [19ms]
2025-12-28 22:07:13.418 [info] > git config --get-all user.email [16ms]
2025-12-28 22:07:13.765 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [143ms]
2025-12-28 22:07:13.765 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:13.780 [info] > git config --get-all user.name [14ms]
2025-12-28 22:07:13.793 [info] > git config --get-all user.email [13ms]
2025-12-28 22:07:14.417 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [167ms]
2025-12-28 22:07:14.417 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:14.446 [info] > git config --get-all user.name [28ms]
2025-12-28 22:07:14.468 [info] > git config --get-all user.email [21ms]
2025-12-28 22:07:15.453 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [179ms]
2025-12-28 22:07:15.453 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:15.476 [info] > git config --get-all user.name [23ms]
2025-12-28 22:07:15.491 [info] > git config --get-all user.email [15ms]
2025-12-28 22:07:16.929 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [184ms]
2025-12-28 22:07:16.929 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:16.957 [info] > git config --get-all user.name [27ms]
2025-12-28 22:07:16.977 [info] > git config --get-all user.email [20ms]
2025-12-28 22:07:18.956 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [177ms]
2025-12-28 22:07:18.956 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:18.982 [info] > git config --get-all user.name [25ms]
2025-12-28 22:07:19.002 [info] > git config --get-all user.email [19ms]
2025-12-28 22:07:21.617 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [163ms]
2025-12-28 22:07:21.617 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:21.636 [info] > git config --get-all user.name [18ms]
2025-12-28 22:07:21.652 [info] > git config --get-all user.email [15ms]
2025-12-28 22:07:25.036 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [178ms]
2025-12-28 22:07:25.036 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:25.061 [info] > git config --get-all user.name [24ms]
2025-12-28 22:07:25.080 [info] > git config --get-all user.email [18ms]
2025-12-28 22:07:29.325 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [189ms]
2025-12-28 22:07:29.325 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:29.354 [info] > git config --get-all user.name [28ms]
2025-12-28 22:07:29.374 [info] > git config --get-all user.email [19ms]
2025-12-28 22:07:34.569 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [190ms]
2025-12-28 22:07:34.570 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:34.584 [info] > git config --get-all user.name [14ms]
2025-12-28 22:07:34.599 [info] > git config --get-all user.email [14ms]
2025-12-28 22:07:34.615 [info] > git config --get commit.template [15ms]
2025-12-28 22:07:34.616 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [15ms]
2025-12-28 22:07:34.633 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 22:07:34.635 [info] > git status -z -uall [18ms]
2025-12-28 22:07:34.657 [info] > git config --get commit.template [18ms]
2025-12-28 22:07:34.660 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [20ms]
2025-12-28 22:07:34.684 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [23ms]
2025-12-28 22:07:34.685 [info] > git status -z -uall [24ms]
2025-12-28 22:07:39.724 [info] > git config --get commit.template [32ms]
2025-12-28 22:07:39.726 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 22:07:39.749 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 22:07:39.751 [info] > git status -z -uall [24ms]
2025-12-28 22:07:44.774 [info] > git config --get commit.template [18ms]
2025-12-28 22:07:44.776 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [20ms]
2025-12-28 22:07:44.796 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 22:07:44.797 [info] > git status -z -uall [20ms]
2025-12-28 22:07:47.392 [info] > git show -s --decorate=full --shortstat --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z db35e5e899df63b912218f7b0de019c684757f3f -- [12756ms]
2025-12-28 22:07:54.268 [info] > git config --get commit.template [16ms]
2025-12-28 22:07:54.269 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [17ms]
2025-12-28 22:07:54.287 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [16ms]
2025-12-28 22:07:54.288 [info] > git status -z -uall [18ms]
2025-12-28 22:07:57.020 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [176ms]
2025-12-28 22:07:57.020 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:57.040 [info] > git config --get-all user.name [19ms]
2025-12-28 22:07:57.057 [info] > git config --get-all user.email [16ms]
2025-12-28 22:07:57.268 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [158ms]
2025-12-28 22:07:57.268 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:57.287 [info] > git config --get-all user.name [18ms]
2025-12-28 22:07:57.303 [info] > git config --get-all user.email [15ms]
2025-12-28 22:07:57.694 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [184ms]
2025-12-28 22:07:57.694 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:57.719 [info] > git config --get-all user.name [24ms]
2025-12-28 22:07:57.738 [info] > git config --get-all user.email [18ms]
2025-12-28 22:07:58.360 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [167ms]
2025-12-28 22:07:58.360 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:58.389 [info] > git config --get-all user.name [28ms]
2025-12-28 22:07:58.410 [info] > git config --get-all user.email [20ms]
2025-12-28 22:07:59.375 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [163ms]
2025-12-28 22:07:59.375 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:07:59.397 [info] > git config --get-all user.name [21ms]
2025-12-28 22:07:59.415 [info] > git config --get-all user.email [17ms]
2025-12-28 22:08:00.831 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [161ms]
2025-12-28 22:08:00.831 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:08:00.855 [info] > git config --get-all user.name [23ms]
2025-12-28 22:08:00.874 [info] > git config --get-all user.email [18ms]
2025-12-28 22:08:02.847 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [170ms]
2025-12-28 22:08:02.847 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:08:02.870 [info] > git config --get-all user.name [22ms]
2025-12-28 22:08:02.886 [info] > git config --get-all user.email [16ms]
2025-12-28 22:08:05.527 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [185ms]
2025-12-28 22:08:05.527 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:08:05.555 [info] > git config --get-all user.name [27ms]
2025-12-28 22:08:05.576 [info] > git config --get-all user.email [20ms]
2025-12-28 22:08:08.946 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [167ms]
2025-12-28 22:08:08.946 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:08:08.973 [info] > git config --get-all user.name [26ms]
2025-12-28 22:08:08.993 [info] > git config --get-all user.email [19ms]
2025-12-28 22:08:13.242 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [193ms]
2025-12-28 22:08:13.242 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:08:13.270 [info] > git config --get-all user.name [27ms]
2025-12-28 22:08:13.291 [info] > git config --get-all user.email [20ms]
2025-12-28 22:08:18.477 [info] > git -c user.useConfigOnly=true commit --quiet --allow-empty-message --file - [180ms]
2025-12-28 22:08:18.477 [info] fatal: cannot lock ref 'HEAD': Unable to create '/Users/faucqueurstacy/Documents/GitHub/app/.git/HEAD.lock': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
2025-12-28 22:08:18.501 [info] > git config --get-all user.name [23ms]
2025-12-28 22:08:18.522 [info] > git config --get-all user.email [21ms]
2025-12-28 22:08:18.540 [info] > git config --get commit.template [17ms]
2025-12-28 22:08:18.541 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [18ms]
2025-12-28 22:08:18.559 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 22:08:18.561 [info] > git status -z -uall [19ms]
2025-12-28 22:08:18.585 [info] > git show -s --decorate=full --shortstat --format=%H%n%aN%n%aE%n%at%n%ct%n%P%n%D%n%B -z db35e5e899df63b912218f7b0de019c684757f3f -- [23ms]
2025-12-28 22:08:19.165 [info] > git fetch [602ms]
2025-12-28 22:08:19.185 [info] > git config --get commit.template [19ms]
2025-12-28 22:08:19.186 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [19ms]
2025-12-28 22:08:19.204 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [17ms]
2025-12-28 22:08:19.205 [info] > git status -z -uall [18ms]
2025-12-28 22:08:20.551 [info] > git config --get commit.template [27ms]
2025-12-28 22:08:20.553 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [28ms]
2025-12-28 22:08:20.576 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 22:08:20.578 [info] > git status -z -uall [24ms]
2025-12-28 22:08:25.605 [info] > git config --get commit.template [20ms]
2025-12-28 22:08:25.607 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [21ms]
2025-12-28 22:08:25.630 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 22:08:25.631 [info] > git status -z -uall [23ms]
2025-12-28 22:08:46.638 [info] > git config --get commit.template [33ms]
2025-12-28 22:08:46.641 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [35ms]
2025-12-28 22:08:46.664 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [21ms]
2025-12-28 22:08:46.668 [info] > git status -z -uall [26ms]
2025-12-28 22:08:51.700 [info] > git config --get commit.template [24ms]
2025-12-28 22:08:51.701 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [24ms]
2025-12-28 22:08:51.721 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 22:08:51.722 [info] > git status -z -uall [20ms]
2025-12-28 22:09:01.534 [info] > git config --get commit.template [22ms]
2025-12-28 22:09:01.536 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [23ms]
2025-12-28 22:09:01.555 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [18ms]
2025-12-28 22:09:01.557 [info] > git status -z -uall [20ms]
2025-12-28 22:09:06.591 [info] > git config --get commit.template [31ms]
2025-12-28 22:09:06.594 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 22:09:06.620 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [24ms]
2025-12-28 22:09:06.621 [info] > git status -z -uall [25ms]
2025-12-28 22:09:11.660 [info] > git config --get commit.template [31ms]
2025-12-28 22:09:11.662 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [32ms]
2025-12-28 22:09:11.686 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 22:09:11.687 [info] > git status -z -uall [24ms]
2025-12-28 22:09:16.724 [info] > git config --get commit.template [32ms]
2025-12-28 22:09:16.727 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [33ms]
2025-12-28 22:09:16.751 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 22:09:16.752 [info] > git status -z -uall [24ms]
2025-12-28 22:09:21.788 [info] > git config --get commit.template [32ms]
2025-12-28 22:09:21.789 [info] > git for-each-ref --format=%(refname)%00%(upstream:short)%00%(objectname)%00%(upstream:track)%00%(upstream:remotename)%00%(upstream:remoteref) --ignore-case refs/heads/main refs/remotes/main [31ms]
2025-12-28 22:09:21.814 [info] > git for-each-ref --sort -committerdate --format %(refname)%00%(objectname)%00%(*objectname) [22ms]
2025-12-28 22:09:21.815 [info] > git status -z -uall [25ms]


*Checked command status*

*Viewed [supabase.ts](file:///Users/faucqueurstacy/Documents/GitHub/app/src/lib/supabase.ts) *

*Viewed [package.json](file:///Users/faucqueurstacy/Documents/GitHub/app/package.json) *

*Viewed [_layout.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/app/%28tabs%29/_layout.tsx) *

*Viewed [profile.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/app/%28tabs%29/profile.tsx) *

*Checked command status*

*Edited relevant file*

*Edited relevant file*

*User accepted the command `npm install`*

*Checked command status*

*Listed directory [app](file:///Users/faucqueurstacy/Documents/GitHub/app/app) *

*Checked command status*

*Viewed [_layout.tsx](file:///Users/faucqueurstacy/Documents/GitHub/app/app/%28tabs%29/_layout.tsx) *

*Checked command status*

*Checked command status*

*Edited relevant file*

*Checked command status*

*Edited relevant file*

*Checked command status*

*Viewed [task.md](file:///Users/faucqueurstacy/.gemini/antigravity/brain/a3a3276b-88a9-46c6-927c-8de191f363ef/task.md) *

*Checked command status*

*Edited relevant file*

*Checked command status*

*Checked command status*

*User accepted the command `npx tsc --noEmit`*

*Checked command status*

*Checked command status*

*Checked command status*

*Edited relevant file*

*Edited relevant file*

*Checked command status*

*User accepted the command `npx tsc --noEmit`*

*Checked command status*

*Checked command status*

*Checked command status*

*Checked command status*

*Edited relevant file*

*Edited relevant file*

### User Input

donne moi un qr code pour tester lappli

*Checked command status*

*User accepted the command `npx expo start`*

*Checked command status*

*Checked command status*

*Checked command status*

*Checked command status*

*Checked command status*

*Checked command status*

*User accepted the command `npx expo start --clear`*

*Checked command status*

*Checked command status*

*Checked command status*

*Edited relevant file*

### User Input

je doit faire quoi

*Checked command status*

*User accepted the command `npm install`*

*Checked command status*

### User Input

c'est bientot fini ?

*Checked command status*

*User accepted the command `npx expo start`*

*Checked command status*

*Checked command status*

*Checked command status*