# Challenge: small-n

- Category: Crypto  
- Difficulty: Easy  
- Author:  
- Platform:  

---

## Mục tiêu | Goal

- Khôi phục lại flag từ `(n, e, c)`  
- Recover the flag from `(n, e, c)`

---

## Ý tưởng chính | Key Idea

- `q` quá nhỏ (32-bit) → có thể factor `n` nhanh → giải RSA  
- `q` is too small (32-bit) → we can factor `n` easily → break RSA

---

## Phân tích | Analysis

### 1. Quan sát ban đầu | Initial Observation

- Đây là RSA cơ bản:
  - `n = p * q`
  - `c = m^e mod n`

- This is basic RSA:
  - `n = p * q`
  - `c = m^e mod n`

---

### 2. Phân tích chi tiết | Deep Analysis

```python
q = getPrime(32)
````

* `q` chỉ có **32-bit** → cực kỳ nhỏ
* `q` is only **32-bit**, which is extremely small

---

Trong RSA chuẩn:

```
p ≈ q (cùng độ lớn)
```

Nhưng ở đây:

```
p ≈ 512-bit  
q ≈ 32-bit
```

⇒ `n` rất dễ bị factor

---

In secure RSA:

```
p ≈ q (same size)
```

But here:

```
p ≈ 512-bit  
q ≈ 32-bit
```

⇒ `n` becomes easily factorable

---

### 3. Lỗ hổng | Vulnerability

* Loại lỗ hổng: Weak RSA
* Nguyên nhân:

  * Sử dụng prime không cân bằng
  * `q` quá nhỏ
  * Dẫn đến có thể factor `n` nhanh

---

* Vulnerability type: Weak RSA (Small Prime Factor)
* Root cause:

  * Unbalanced primes
  * `q` is too small
  * Allows fast factorization

---

## Khai thác | Exploitation

### Attack Flow

* Factor `n` → tìm `p`, `q`
* Tính `phi(n)`
* Tính `d = e^{-1} mod phi(n)`
* Decrypt lấy flag

---

* Factor `n` → get `p`, `q`
* Compute `phi(n)`
* Compute `d = e^{-1} mod phi(n)`
* Decrypt to recover flag

---

### Exploit Script

```python
from Crypto.Util.number import *
from sympy import factorint

n = 28576441902831457590427748668696557474043630372677632241672926869035931925834848020457746529998588578832822195110996090327253913633985879817257290686867076047319213
e = 65537
c = 20416582581078679030890390494251758803999983698670759422923367333586408291714658619559562503769379652576538080202274167806350679198100959619974180892435535730583248

# Factor n
factors = factorint(n)
print("[+] Factors:", factors)

p, q = list(factors.keys())

# Compute private key
phi = (p - 1) * (q - 1)
d = inverse(e, phi)

# Decrypt
m = pow(c, d, n)
flag = long_to_bytes(m)

print("[+] Flag:", flag)
```

---

## FLAG

```
Alpaca{paca?_pacapaca!!!!_dont_use_small_p_q_paca!!!!}
```

---

## Notes

* Dạng bài:

  * Weak RSA
  * Small prime factor attack

---

* Challenge type:

  * Weak RSA
  * Small prime attack

---

## Takeaway

* Không dùng prime nhỏ trong RSA
* Luôn đảm bảo `p ≈ q`

---

* Never use small primes in RSA
* Always use balanced primes
