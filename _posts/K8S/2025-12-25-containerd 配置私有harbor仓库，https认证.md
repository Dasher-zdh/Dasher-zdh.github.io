## containerd 配置私有harbor仓库，https认证

containerd环境: v2.2.0

k8s环境：1.34,安装ingress和helm

### 通过helm搭建harbor[步骤略]

helm install k8s-harbor  -n harbor .

### 设置认证

当要从非安全的镜像仓库中进行 `Pull`、`Push` 时，会遇到 `x509: certificate signed by unknown authority` 错误提示； 这是由于镜像仓库是可能是 `http` 服务，或者 `https` 的证书是自签名的就会出现这个问题。



k8s连接到harbor会有两个认证，第一个是自签名证书，因为不是受信用机构签发的，需要做认证，第二个是用户名密码，如果是公开仓库可以不用用户名密码认证操作。

####  证书认证设置

**查看harbor对外提供服务的ingress：**

```
[root@core ~]# kubectl get secret -n harbor |grep ingres
k8s-harbor-ingress                 kubernetes.io/tls                3      18d
```

**获取证书文件**

```
[root@core ~]# kubectl get secret k8s-harbor-ingress -n harbor \
  -o jsonpath='{.data.ca\.crt}' | base64 -d > harbor-ca.crt

[root@core ~]# kubectl get secret k8s-harbor-ingress -n harbor \
  -o jsonpath='{.data.tls\.crt}' | base64 -d > harbor.crt

[root@core ~]# kubectl get secret k8s-harbor-ingress -n harbor \
  -o jsonpath='{.data.tls\.key}' | base64 -d > harbor.key

[root@core ~]# ll
-rw-r--r-- 1 root root 1127 Dec 24 14:39 harbor-ca.crt
-rw-r--r-- 1 root root 1180 Dec 24 14:39 harbor.crt
-rw-r--r-- 1 root root 1675 Dec 24 14:39 harbor.key
```

**配置containerd连接harbor仓库使用配置证书文件**

配置文件` /etc/containerd/config.toml`修改：

```
  [plugins.'io.containerd.cri.v1.images'.registry]
      config_path = '/etc/containerd/certs.d'
```

配置文件` /etc/containerd/certs.d/harbor域名`修改，同时将生成得证书文件拷贝到`/etc/containerd/certs.d/harbor域名`：

```
[root@core core.harbor.domain]# vi hosts.toml 
server = "https://harbor域名"

[host."https://harbor域名"]
  capabilities = ["pull", "resolve"]
  ca = "/etc/containerd/certs.d/harbor域名/harbor-ca.crt"
  cert = "/etc/containerd/certs.d/harbor域名/harbor.crt"
  key  = "/etc/containerd/certs.d/harbor域名/harbor.key"
```

**重新启动containerd加载配置**

```
[root@core core.harbor.domain]# systemctl restart containerd
```

#### 用户名密码认证设置

```
#!/bin/bash

HARBOR_SERVER=core.harbor.domain
HARBOR_USER=user
HARBOR_PASS=xxxxxxxx

for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  kubectl get secret harbor-regcred -n $ns >/dev/null 2>&1 || \
  kubectl create secret docker-registry harbor-regcred \
    --docker-server=$HARBOR_SERVER \
    --docker-username=$HARBOR_USER \
    --docker-password=$HARBOR_PASS \
    --docker-email=harbor@local \
    -n $ns

  kubectl patch serviceaccount default \
    -n $ns \
    -p '{"imagePullSecrets":[{"name":"harbor-regcred"}]}' \
    --type merge
done

```

